import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Tag,
  Space,
  Switch,
  theme,
  ConfigProvider,
} from "antd";
import dayjs from "dayjs";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import axios from "axios";

const priorities = {
  High: "red",
  Medium: "orange",
  Low: "green",
};

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [isDark, setIsDark] = useState(false);

  const API = "http://localhost:5000/tasks";

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await axios.get(API);
        setTasks(data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

  const handleAddOrEdit = async () => {
    try {
      const values = await form.validateFields();
      const taskPayload = {
        ...values,
        dueDate: values.dueDate.format("YYYY-MM-DD"),
        completed: editingTask?.completed || false,
      };

      if (editingTask) {
        const { data } = await axios.put(`${API}/${editingTask._id}`, taskPayload);
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? data : t)));
      } else {
        const { data } = await axios.post(API, taskPayload);
        setTasks((prev) => [...prev, data]);
      }

      setIsModalOpen(false);
      setEditingTask(null);
      form.resetFields();
    } catch (err) {
      console.error("Validation or submission failed", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleComplete = async (id) => {
    try {
      const task = tasks.find((t) => t._id === id);
      const updatedTask = { ...task, completed: !task.completed };
      const { data } = await axios.put(`${API}/${id}`, updatedTask);
      setTasks((prev) => prev.map((t) => (t._id === id ? data : t)));
    } catch (err) {
      console.error("Error updating completion status:", err);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (filterStatus === "Completed") return task.completed;
        if (filterStatus === "Pending") return !task.completed;
        return true;
      })
      .filter((task) =>
        task.title.toLowerCase().includes(searchText.toLowerCase())
      );
  }, [tasks, filterStatus, searchText]);

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Description",
      dataIndex: "description",
      responsive: ["md"],
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      sorter: (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      sorter: (a, b) => a.priority.localeCompare(b.priority),
      render: (priority) => <Tag color={priorities[priority]}>{priority}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "completed",
      filters: [
        { text: "Completed", value: true },
        { text: "Pending", value: false },
      ],
      onFilter: (value, record) => record.completed === value,
      render: (completed) =>
        completed ? <Tag color="green">Done</Tag> : <Tag color="blue">Pending</Tag>,
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<CheckOutlined />}
            onClick={() => handleComplete(record._id)}
            type="link"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              form.setFieldsValue({
                ...record,
                dueDate: dayjs(record.dueDate),
              });
              setEditingTask(record);
              setIsModalOpen(true);
            }}
            type="link"
          />
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
            type="link"
            danger
          />
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div style={{ padding: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <h2>🗂️ Task Management Dashboard</h2>
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTask(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
            >
              Add Task
            </Button>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { label: "All", value: "All" },
                { label: "Completed", value: "Completed" },
                { label: "Pending", value: "Pending" },
              ]}
            />
            <Input.Search
              placeholder="Search by title"
              onSearch={setSearchText}
              allowClear
              style={{ width: 200 }}
            />
            <span>
              Dark Mode <Switch checked={isDark} onChange={setIsDark} />
            </span>
          </Space>

          <Table
            dataSource={filteredTasks}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
            bordered
            scroll={{ x: true }}
          />
        </Space>

        <Modal
          open={isModalOpen}
          title={editingTask ? "Edit Task" : "Add Task"}
          onCancel={() => setIsModalOpen(false)}
          onOk={handleAddOrEdit}
          okText="Save"
        >
          <Form layout="vertical" form={form}>
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Description is required" }]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[{ required: true, message: "Due date is required" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: "Priority is required" }]}
            >
              <Select
                options={Object.keys(priorities).map((p) => ({
                  label: p,
                  value: p,
                }))}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default App;
