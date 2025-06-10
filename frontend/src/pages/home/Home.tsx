import './Home.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
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
        <div className="new-task">
          <button onClick={() => setOpen(true)}>
            <FontAwesomeIcon icon={faPlus} style={{ color: "#282929", marginRight: "2px" }} /> <span>New Task</span>
          </button>
        </div>

        <div className='tasksPeriod'>
          <button
            className={selectComponent === "daily" ? "active" : ""}
            onClick={() => setSelectComponent("daily")}>Daily</button>
          <button
            className={selectComponent === "weekly" ? "active" : ""}
            onClick={() => setSelectComponent("weekly")}>Weekly</button>
          <button
            className={selectComponent === "monthly" ? "active" : ""}
            onClick={() => setSelectComponent("monthly")}>Monthly</button>
        </div>
      </div>

      <Dialogbox
        open={open}
        handleClose={() => {
          setOpen(false);
          setTaskToEdit(null);
        }}
        onTaskCreatedOrEdited={() => userId && fetchTasks(userId)} 
        taskToEdit={taskToEdit}
      />

      <div>
        {loading ? (
          <div className="loader">
            <ClipLoader color={"#123abc"} loading={loading} size={50} />
          </div>
        ) : !userId ? ( 
          <h1 style={{ textAlign: 'center', marginTop: '50px' }}>Login first to see task</h1>
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