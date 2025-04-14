// src/renderer/components/WorkBlockItem.tsx
import React, { useState, useRef, useEffect } from 'react';
import { WorkBlock } from '../../shared/types';
import './WorkBlockItem.css'; // Import CSS

interface WorkBlockItemProps {
    block: WorkBlock;
    onUpdate: (updatedBlock: WorkBlock) => void;
}

const WorkBlockItem: React.FC<WorkBlockItemProps> = ({ block, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(block.text);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            autoAdjustHeight(inputRef.current);
        }
    }, [isEditing]);

    const autoAdjustHeight = (element: HTMLTextAreaElement) => {
        element.style.height = 'inherit';
        const scrollHeight = element.scrollHeight;
        element.style.height = `${scrollHeight}px`;
    };

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditText(event.target.value);
        if (inputRef.current) {
            autoAdjustHeight(inputRef.current);
        }
    };

    const handleBlur = () => {
        saveChanges();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && event.shiftKey) {
            requestAnimationFrame(() => {
                if (inputRef.current) {
                    autoAdjustHeight(inputRef.current);
                }
            });
            return;
        }
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            saveChanges();
        } else if (event.key === 'Escape') {
            setEditText(block.text);
            setIsEditing(false);
        }
    };

    const saveChanges = () => {
        const trimmedText = editText.trim();
        if (trimmedText !== block.text) {
            onUpdate({ ...block, text: trimmedText });
        }
        setIsEditing(false);
    };

    const formattedStartTime = new Date(block.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="work-block-item">
            <span className="work-block-time">{formattedStartTime}</span>
            {isEditing ? (
                <textarea
                    ref={inputRef}
                    value={editText}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="work-block-edit-input"
                    rows={1}
                />
            ) : (
                <span
                    className="work-block-text"
                    onDoubleClick={handleDoubleClick}
                    title="双击编辑"
                >
                    {block.text}
                </span>
            )}
        </div>
    );
};

export default WorkBlockItem; 