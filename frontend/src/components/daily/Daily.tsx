import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTransition } from '@react-spring/web';
import './Daily.css';

interface Task {
  id: number;
  title: string;
  description: string;
  frequency: string;
  due_date: string;
  due_time: string;
}

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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [columns, setColumns] = useState(2);
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const dailyTasks = tasks.filter(
    (task) => task.frequency.toLowerCase() === 'daily'
  );

  // Responsive column count
  useEffect(() => {
    const updateColumns = () => {
      if (window.matchMedia('(min-width: 1500px)').matches) setColumns(5);
      else if (window.matchMedia('(min-width: 1000px)').matches) setColumns(4);
      else if (window.matchMedia('(min-width: 600px)').matches) setColumns(3);
      else setColumns(1);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Track container width
  useEffect(() => {
    const handleResize = () => {
      if (ref.current) setWidth(ref.current.offsetWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [ref]);

  // Calculate positions for Masonry layout
  const [heights, gridItems] = useMemo(() => {
    let heights = new Array(columns).fill(0);
    let items = dailyTasks.map((task) => {
      const height = 240; // fixed height for each card, adjust if needed
      const column = heights.indexOf(Math.min(...heights));
      const x = (width / columns) * column;
      const y = (heights[column] += height) - height;
      return { ...task, x, y, width: width / columns, height };
    });
    return [heights, items];
  }, [columns, dailyTasks, width]);

  const transitions = useTransition(gridItems, {
    keys: (item) => item.id,
    from: ({ x, y, width, height }) => ({ x, y, width, height, opacity: 0 }),
    enter: ({ x, y, width, height }) => ({ x, y, width, height, opacity: 1 }),
    update: ({ x, y, width, height }) => ({ x, y, width, height }),
    leave: { opacity: 0 },
    config: { mass: 5, tension: 500, friction: 100 },
    trail: 25,
  });

  const handleDelete = async (taskId: number) => {
    setDeletingId(taskId);
    try {
      const res = await fetch(`${apiUrl}/delete_task/${taskId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
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
        <div ref={ref} className="masonry" style={{ height: Math.max(...heights) }}>
          {transitions((style, item) => (
            <div key={item.id} style={style} className="task-animated">
              <div className="task-card">
                <div className="task-content">
                  <h3 className="task-title">{item.title}</h3>
                  <p className="task-desc">{item.description}</p>
                </div>

                <div className="date_time-action_btn">
                  <div className="task-datetime">
                    <span>{item.due_date} </span>
                    <span>{item.due_time}</span>
                  </div>

                  <div className="task-actions">
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="delete-btn"
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Delete'}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
