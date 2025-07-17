import React, { useState } from 'react';
import { Task } from "../../interfaces/task";
import "./Daily.css";

interface DailyProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onTaskDeleted: () => void;
  onEdit: (task: Task) => void;
}

export const Daily: React.FC<DailyProps> = ({
  tasks,
  setTasks,
  onTaskDeleted,
  onEdit,
}) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dailyTasks = tasks.filter(
    (task) => typeof task.frequency === 'string' && task.frequency.toLowerCase() === 'daily'
  );

  const handleDelete = async (taskId: string) => {
    setDeletingId(taskId);
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${apiUrl}/delete_task/${taskId}`, {
        method: 'DELETE',
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      });

      if (res.ok) {
        setTasks((prev) => prev.filter((task) => task._id !== taskId));
        onTaskDeleted();
      } else {
        const data = await res.json();
        console.error('Failed to delete task:', data.message);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="daily-tasks">
      <div className="task-header"><p>Daily Tasks</p></div>
      {dailyTasks.length === 0 ? (
        <p className="no-tasks">No daily tasks yet.</p>
      ) : (
        <div className="task-grid">
          {dailyTasks.map((item) => (
            <div key={item._id} className="task-card">
              <div className="task-content">
                <h3 className="task-title">{item.title}</h3>
                <p className="task-desc">{item.description}</p>
              </div>

              <div className="date_time-action_btn">
                <div className="task-datetime">
                  <span>{item.due_date}</span>
                  <span>{item.due_time}</span>
                </div>

                <div className="task-actions">
                  <button
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                    className="delete-btn"
                  >
                    {deletingId === item._id ? 'Deleting...' : 'Delete'}
                  </button>

                  <button
                    className="edit-btn"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </button>

                  <button className="share-btn" disabled>
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
