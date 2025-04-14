// src/renderer/components/WorkBlockList.tsx
import React from 'react';
import { WorkBlock } from '../../shared/types';
import WorkBlockItem from './WorkBlockItem';
import './WorkBlockList.css'; // Import CSS

interface WorkBlockListProps {
    activeWorkBlock: WorkBlock | null | undefined; // Add active block prop
    workBlocks: WorkBlock[];
    onUpdateBlock: (updatedBlock: WorkBlock) => void;
}

const WorkBlockList: React.FC<WorkBlockListProps> = ({ activeWorkBlock, workBlocks, onUpdateBlock }) => {
    // Combine active block (if exists) with completed blocks
    // Filter completed blocks just in case the active one is somehow duplicated
    const completedBlocks = workBlocks.filter(b => b.id !== activeWorkBlock?.id);
    const allBlocksToShow = activeWorkBlock ? [activeWorkBlock, ...completedBlocks] : completedBlocks;

    if (allBlocksToShow.length === 0) {
        return <p>开始一个番茄钟来记录工作吧！</p>;
    }

    // Sort combined list by start time, most recent first
    const sortedBlocks = allBlocksToShow.sort((a, b) => b.startTime - a.startTime);

    return (
        <div className="work-block-list">
            {sortedBlocks.map((block) => (
                <WorkBlockItem
                    key={block.id}
                    block={block}
                    onUpdate={onUpdateBlock}
                />
            ))}
        </div>
    );
};

export default WorkBlockList; 