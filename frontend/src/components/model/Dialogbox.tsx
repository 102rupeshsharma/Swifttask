import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import "./Dialogbox.css";
import { toast } from "react-toastify";

interface Task {
  _id: string;
  title: string;
  description: string;
  frequency: string;
  due_date: string;
  due_time: string;
}

interface DialogProps {
  open: boolean;
  handleClose: () => void;
  taskToEdit?: Task | null;
  onTaskCreatedOrEdited: () => void;
}

const Dialogbox: React.FC<DialogProps> = ({
  open,
  handleClose,
  taskToEdit,
  onTaskCreatedOrEdited,
}) => {
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const apiUrl = import.meta.env.VITE_API_URL;
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate);
  const [time, setTime] = useState<string>(getCurrentTime);

  useEffect(() => {
    if (taskToEdit) {
      setTaskTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setSelectedOption(taskToEdit.frequency as "Daily" | "Weekly" | "Monthly");
      setSelectedDate(taskToEdit.due_date);
      setTime(taskToEdit.due_time);
    } else {
      setTaskTitle("");
      setDescription("");
      setSelectedOption("Daily");
      setSelectedDate(getCurrentDate());
      setTime(getCurrentTime());
    }
  }, [taskToEdit, open]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value as "Daily" | "Weekly" | "Monthly");
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    if (!token) return alert("Login required");
    if (!taskTitle || !description) return alert("Please fill out all fields.");

    const taskData = {
      title: taskTitle,
      description,
      frequency: selectedOption,
      due_date: selectedDate,
      due_time: time,
    };

    try {
      const url = taskToEdit
        ? `${apiUrl}/update_task/${taskToEdit._id}`
        : `${apiUrl}/tasks`;

      const method = taskToEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(taskToEdit ? "Task updated" : "Task created");
        handleClose();
        onTaskCreatedOrEdited();
      } else {
        alert(data.message || "Failed to submit task");
      }
    } catch (error) {
      console.error("Task submission failed:", error);
      alert("Server error");
    }
  };


  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle style={{ display: "flex", justifyContent: "center", color: "black" }}>
        {taskToEdit ? "Edit Task" : "New Task"}
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column" }}>
        <input
          className="input-field"
          type="text"
          placeholder="Enter task title"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />
        <textarea
          className="textbox"
          placeholder="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="select_container">
          <select
            id="frequency"
            value={selectedOption}
            onChange={handleChange}
            className="selectBox"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
        <div className="date-picker-container">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="time-picker-container">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </DialogContent>

      <DialogActions sx={{ display: "flex", justifyContent: "center" }}>
        <Button onClick={handleSubmit} className="submit-btn">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Dialogbox;
