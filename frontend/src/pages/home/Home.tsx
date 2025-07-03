import './Home.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Daily } from '../../components/daily/Daily';
import { Weekly } from '../../components/weekly/Weekly';
import { Monthly } from '../../components/monthly/Monthly';
import Dialogbox from '../../components/model/Dialogbox';
import { useEffect, useState } from 'react';
import Header from '../../components/header/Header';
import ClipLoader from "react-spinners/ClipLoader";

interface Task {
  id: number;
  title: string;
  description: string;
  frequency: string;
  due_date: string;
  due_time: string;
}

export const Home = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [selectComponent, setSelectComponent] = useState("daily");
  const [open, setOpen] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setOpen(true);
  };

  const fetchTasks = async (userId: string) => {
    try {
      const res = await fetch(`${apiUrl}/tasks/${userId}`);
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks);
        console.log("✅ Task list refreshed");
      } else {
        console.error("Fetch error:", data.message);
      }
    } catch (err) {
      console.error("Server error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");

    if (!storedUserId) {
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(storedUserId);
    fetchTasks(storedUserId);
  }, []);

  return (
    <>
      <Header />

      <div className="task-dashboard">
        {/* New Task Button */}
        <div className="new-task">
          <button onClick={() => setOpen(true)} className="task-btn">
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: "6px" }} />
            <span>New Task</span>
          </button>
        </div>

        {/* Task Frequency Selector */}
        <div className='tasksPeriod'>
          {["daily", "weekly", "monthly"].map((period) => (
            <button
              key={period}
              className={`period-btn ${selectComponent === period ? "active" : ""}`}
              onClick={() => setSelectComponent(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Dialogbox for Add/Edit */}
      <Dialogbox
        open={open}
        handleClose={() => {
          setOpen(false);
          setTaskToEdit(null);
        }}
        onTaskCreatedOrEdited={() => userId && fetchTasks(userId)}
        taskToEdit={taskToEdit}
      />

      {/* Task Section */}
      <div>
        {loading ? (
          <div className="loader">
            <ClipLoader color={"#2563eb"} loading={loading} size={50} />
          </div>
        ) : !userId ? (
          <div className="welcome-container">
            <div className="welcome-msg">
              <h1>Welcome to <span>SwiftTask</span> 📝</h1>
              <p>Organize your daily, weekly, and monthly tasks efficiently.<br />Log in to get started!</p>
            </div>
          </div>
        ) : (
          <>
            {selectComponent === "daily" && (
              <Daily
                tasks={tasks}
                setTasks={setTasks}
                onTaskDeleted={() => fetchTasks(userId)}
                onEdit={handleEditTask}
              />
            )}
            {selectComponent === "weekly" && (
              <Weekly
                tasks={tasks}
                setTasks={setTasks}
                onTaskDeleted={() => fetchTasks(userId)}
                onEdit={handleEditTask}
              />
            )}
            {selectComponent === "monthly" && (
              <Monthly
                tasks={tasks}
                setTasks={setTasks}
                onTaskDeleted={() => fetchTasks(userId)}
                onEdit={handleEditTask}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};
