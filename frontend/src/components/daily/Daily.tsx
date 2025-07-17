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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');

  const dailyTasks = tasks.filter(
    (task) => typeof task.frequency === 'string' && task.frequency.toLowerCase() === 'daily'
  );

  const handleDelete = async (taskId: string) => {
    setDeletingId(taskId);
    try {
      const token = localStorage.getItem("token");
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

  const openShareModal = (task: Task) => {
    setSelectedTask(task);
    setShareModalOpen(true);
  };

  const closeShareModal = () => {
    setSelectedTask(null);
    setRecipientEmail('');
    setShareModalOpen(false);
  };

const handleShare = async () => {
  if (!selectedTask || !recipientEmail) {
    alert("Please enter recipient email and select a task.");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${apiUrl}/share_task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        task: {
          title: selectedTask.title,
          description: selectedTask.description,
          due_date: selectedTask.due_date,
          due_time: selectedTask.due_time,
          frequency: selectedTask.frequency,
        },
      }),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Task shared successfully!");
      closeShareModal();
    } else {
      alert("Failed to share task: " + result.message);
    }
  } catch (err) {
    alert("Error sharing task");
    console.error(err);
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

                  <button
                    className="share-btn"
                    onClick={() => openShareModal(item)}
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && selectedTask && (
        <div className="modal-overlay">
          <div className="share-modal">
            <h2>Share Task</h2>
            <p><strong>Title:</strong> {selectedTask.title}</p>
            <p><strong>Description:</strong> {selectedTask.description}</p>
            <p><strong>Date:</strong> {selectedTask.due_date}</p>
            <p><strong>Time:</strong> {selectedTask.due_time}</p>

            <input
              type="email"
              placeholder="Enter recipient email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="email-input"
            />

            <div className="modal-actions">
              <button onClick={handleShare} className="send-btn">Send</button>
              <button onClick={closeShareModal} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
