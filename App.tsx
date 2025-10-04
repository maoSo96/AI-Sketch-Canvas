
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CanvasSize, CanvasItem, CanvasItemType } from './types';
import { generateImageFromSketch } from './services/geminiService';

declare const html2canvas: any;

// --- Icon Components ---
const TextIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h3M3 10h11M3 14h11M3 18h3M7 6h14M7 10h7M7 14h7M7 18h14" />
  </svg>
);

const ImageIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const RotateIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M5.5 9.5A8.001 8.001 0 0119.07 8.93M20 20v-5h-5m-1.5-4.5a8.003 8.003 0 01-13.07 6.07" />
    </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ResizeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" />
    </svg>
);

const ZoomInIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
  </svg>
);

const ZoomOutIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
    </svg>
);

const DownloadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const MoveIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M5 9l-3 3 3 3M19 9l3 3-3 3M9 5l3-3 3 3M9 19l3 3 3 3" />
    </svg>
);

const UndoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8a5 5 0 000-10H9" />
    </svg>
);

const RedoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 15l3-3m0 0l-3-3m3 3H5a5 5 0 000 10h1" />
    </svg>
);

// --- CanvasItem Component ---
type ActiveTool = 'select' | 'pan';
interface CanvasItemProps {
  item: CanvasItem;
  onUpdate: (item: CanvasItem) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  activeTool: ActiveTool;
}

const CanvasItemComponent: React.FC<CanvasItemProps> = ({ item, onUpdate, onDelete, isSelected, onSelect, canvasRef, zoom, activeTool }) => {
  const [isEditing, setIsEditing] = useState(item.type === CanvasItemType.TEXT && item.content === 'New Text');
  const [editedText, setEditedText] = useState(item.content);
  const itemRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<{ type: 'drag' | 'rotate' | 'resize' | null; startX: number; startY: number; itemStartX: number; itemStartY: number; itemStartRotation: number; itemStartWidth: number; itemStartHeight: number; itemStartFontSize?: number; }>({ type: null, startX: 0, startY: 0, itemStartX: 0, itemStartY: 0, itemStartRotation: 0, itemStartWidth: 0, itemStartHeight: 0 });

  const handleTextDoubleClick = () => {
    if (item.type === CanvasItemType.TEXT && activeTool === 'select') {
      setIsEditing(true);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedText(e.target.value);
    
    // Auto-grow textarea and its container during editing
    if (itemRef.current) {
        const textarea = e.target;
        textarea.style.height = 'auto'; // Reset height to calculate scrollHeight correctly
        const newHeight = textarea.scrollHeight;
        textarea.style.height = `${newHeight}px`;
        itemRef.current.style.height = `${newHeight}px`; // Match container height
    }
  };

  const handleTextBlur = () => {
    if (!itemRef.current) {
        onUpdate({ ...item, content: editedText });
        setIsEditing(false);
        return;
    }
    const newHeight = itemRef.current.offsetHeight;
    onUpdate({ ...item, content: editedText, height: newHeight });
    setIsEditing(false);
  };
  
  useEffect(() => {
    // Auto-resize textarea when entering edit mode
    if (isEditing && itemRef.current) {
      const textarea = itemRef.current.querySelector('textarea');
      if (textarea) {
        textarea.style.height = 'auto';
        const newHeight = textarea.scrollHeight;
        textarea.style.height = `${newHeight}px`;
        itemRef.current.style.height = `${newHeight}px`;
      }
    }
  }, [isEditing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!actionRef.current.type || !itemRef.current || !canvasRef.current) return;
    
    e.preventDefault();
    const { type, startX, startY, itemStartX, itemStartY, itemStartRotation, itemStartWidth, itemStartHeight, itemStartFontSize } = actionRef.current;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const dxInCanvasSpace = dx / zoom;
    const dyInCanvasSpace = dy / zoom;

    if (type === 'drag') {
        const newX = itemStartX + dxInCanvasSpace;
        const newY = itemStartY + dyInCanvasSpace;
        itemRef.current.style.left = `${newX}px`;
        itemRef.current.style.top = `${newY}px`;
        itemRef.current.style.transform = `rotate(${itemStartRotation}deg)`;
    } else if (type === 'rotate') {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const centerX = itemStartX + itemStartWidth / 2;
        const centerY = itemStartY + itemStartHeight / 2;
        const mouseX = (e.clientX - canvasRect.left) / zoom;
        const mouseY = (e.clientY - canvasRect.top) / zoom;
        const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
        const degrees = angle * (180 / Math.PI);
        const newRotation = Math.round(degrees + 90);
        itemRef.current.style.transform = `rotate(${newRotation}deg)`;
    } else if (type === 'resize') {
        const rad = (itemStartRotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const dxUnrotated = dxInCanvasSpace * cos + dyInCanvasSpace * sin;
        const dyUnrotated = -dxInCanvasSpace * sin + dyInCanvasSpace * cos;

        let newWidth: number, newHeight: number;

        if (item.type === CanvasItemType.IMAGE && itemStartHeight > 0) {
            const aspectRatio = itemStartWidth / itemStartHeight;
            const newWidthFromX = itemStartWidth + dxUnrotated;
            const newWidthFromY = (itemStartHeight + dyUnrotated) * aspectRatio;
            newWidth = Math.max(20, (newWidthFromX + newWidthFromY) / 2);
            newHeight = newWidth / aspectRatio;
        } else {
            newWidth = Math.max(20, itemStartWidth + dxUnrotated);
            newHeight = Math.max(20, itemStartHeight + dyUnrotated);
        }

        itemRef.current.style.width = `${newWidth}px`;
        itemRef.current.style.height = `${newHeight}px`;

        if (item.type === CanvasItemType.TEXT && itemStartFontSize) {
            const textElement = itemRef.current.querySelector('div, textarea');
            if (textElement) {
                const newFontSize = Math.max(8, itemStartFontSize * (newHeight / itemStartHeight));
                (textElement as HTMLElement).style.fontSize = `${newFontSize}px`;
            }
        }
    }
  }, [canvasRef, item.type, zoom]);

  const stopAction = useCallback((e: MouseEvent) => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopAction);

    if (!actionRef.current.type || !itemRef.current) return;

    const { type, startX, startY, itemStartX, itemStartY, itemStartRotation, itemStartWidth, itemStartHeight, itemStartFontSize } = actionRef.current;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dxInCanvasSpace = dx / zoom;
    const dyInCanvasSpace = dy / zoom;

    if (type === 'drag') {
        onUpdate({
            ...item,
            x: itemStartX + dxInCanvasSpace,
            y: itemStartY + dyInCanvasSpace,
        });
    } else if (type === 'rotate' && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const centerX = itemStartX + itemStartWidth / 2;
        const centerY = itemStartY + itemStartHeight / 2;
        const mouseX = (e.clientX - canvasRect.left) / zoom;
        const mouseY = (e.clientY - canvasRect.top) / zoom;
        const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
        const degrees = angle * (180 / Math.PI);
        onUpdate({ ...item, rotation: Math.round(degrees + 90) });
    } else if (type === 'resize') {
        const rad = (itemStartRotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const dxUnrotated = dxInCanvasSpace * cos + dyInCanvasSpace * sin;
        const dyUnrotated = -dxInCanvasSpace * sin + dyInCanvasSpace * cos;

        let newWidth: number, newHeight: number;

        if (item.type === CanvasItemType.IMAGE && itemStartHeight > 0) {
            const aspectRatio = itemStartWidth / itemStartHeight;
            const newWidthFromX = itemStartWidth + dxUnrotated;
            const newWidthFromY = (itemStartHeight + dyUnrotated) * aspectRatio;
            newWidth = Math.max(20, (newWidthFromX + newWidthFromY) / 2);
            newHeight = newWidth / aspectRatio;
        } else {
            newWidth = Math.max(20, itemStartWidth + dxUnrotated);
            newHeight = Math.max(20, itemStartHeight + dyUnrotated);
        }
        
        const updatedItem: CanvasItem = {
            ...item,
            width: newWidth,
            height: newHeight,
        };

        if (item.type === CanvasItemType.TEXT && itemStartFontSize) {
            updatedItem.fontSize = Math.max(8, itemStartFontSize * (newHeight / itemStartHeight));
        }

        onUpdate(updatedItem);
    }

    actionRef.current.type = null;
  }, [handleMouseMove, onUpdate, item, canvasRef, zoom]);
  
  const startAction = useCallback((e: React.MouseEvent, type: 'drag' | 'rotate' | 'resize') => {
    if (activeTool === 'pan') return;
    
    e.preventDefault();
    e.stopPropagation();
    onSelect(item.id);

    if (!canvasRef.current || !itemRef.current) return;
    
    actionRef.current = {
        type,
        startX: e.clientX,
        startY: e.clientY,
        itemStartX: item.x,
        itemStartY: item.y,
        itemStartRotation: item.rotation,
        itemStartWidth: item.width,
        itemStartHeight: item.height,
        itemStartFontSize: item.fontSize,
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopAction);
  }, [item, onSelect, handleMouseMove, stopAction, activeTool]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopAction);
    };
  }, [handleMouseMove, stopAction]);

  return (
    <div
      ref={itemRef}
      data-type={item.type}
      className={`absolute ${activeTool === 'select' ? 'cursor-grab' : 'cursor-default'} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800' : ''}`}
      style={{
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center center',
      }}
      onMouseDown={(e) => startAction(e, 'drag')}
      onDoubleClick={handleTextDoubleClick}
    >
      {item.type === CanvasItemType.IMAGE && (
        <img src={item.content} alt="canvas item" className="w-full h-full object-cover pointer-events-none" />
      )}
      {item.type === CanvasItemType.TEXT && (
        isEditing ? (
          <textarea
            value={editedText}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            className="w-full h-full bg-transparent text-white border-2 border-dashed border-blue-400 resize-none p-1"
            style={{ fontSize: item.fontSize, color: item.color }}
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="w-full h-full flex items-start p-1 pointer-events-none" style={{ fontSize: item.fontSize, color: item.color, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {item.content}
          </div>
        )
      )}
      {isSelected && activeTool === 'select' && (
        <>
            <div
                className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-alias text-white hover:bg-blue-400"
                onMouseDown={(e) => startAction(e, 'rotate')}
                title="Rotate"
            >
                <RotateIcon className="w-4 h-4" />
            </div>
            <button
                className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-400"
                onClick={() => onDelete(item.id)}
                onMouseDown={(e) => e.stopPropagation()}
                title="Delete"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
            <div
                className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-nwse-resize text-white hover:bg-blue-400"
                onMouseDown={(e) => startAction(e, 'resize')}
                title="Resize"
            >
                <ResizeIcon className="w-4 h-4" />
            </div>
        </>
      )}
    </div>
  );
};


// --- LayersPanel Component ---
interface LayersPanelProps {
    items: CanvasItem[];
    selectedItemId: string | null;
    onSelectItem: (id: string) => void;
    onDeleteItem: (id: string) => void;
    onReorderItems: (dragIndex: number, hoverIndex: number) => void;
}
const LayersPanel: React.FC<LayersPanelProps> = ({ items, selectedItemId, onSelectItem, onDeleteItem, onReorderItems }) => {
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const [dragged, setDragged] = useState(false);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
        // To avoid showing the browser's default drag preview
        // e.dataTransfer.setDragImage(e.currentTarget, -10, -10); 
        setTimeout(() => setDragged(true), 0);
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        dragOverItem.current = index;
        const reversedItems = [...items].reverse();
        if (dragItem.current !== null && dragItem.current !== index) {
            const reordered = [...reversedItems];
            const dragged = reordered.splice(dragItem.current, 1)[0];
            reordered.splice(index, 0, dragged);
            // This is a preview reorder, actual state update happens on drop
        }
    };

    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            onReorderItems(dragItem.current, dragOverItem.current);
        }
        dragItem.current = null;
        dragOverItem.current = null;
        setDragged(false);
    };

    const reversedItems = [...items].reverse();

    return (
        <div className="w-52 flex-shrink-0 flex flex-col gap-4 bg-gray-800 p-4 rounded-lg h-full">
            <h3 className="text-lg font-semibold">Layers</h3>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">
                {reversedItems.length === 0 && <p className="text-gray-400 text-sm">Add items to the canvas to see layers here.</p>}
                {reversedItems.map((item, index) => (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => onSelectItem(item.id)}
                        className={`
                            flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-150
                            ${selectedItemId === item.id ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}
                            ${dragItem.current === index && dragged ? 'opacity-50' : ''}
                        `}
                    >
                        <div className="w-10 h-10 bg-gray-600 rounded flex-shrink-0 flex items-center justify-center">
                            {item.type === CanvasItemType.IMAGE ? (
                                <img src={item.content} alt="thumbnail" className="w-full h-full object-cover rounded"/>
                            ) : (
                                <TextIcon className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-grow truncate text-sm">
                            {item.type === CanvasItemType.TEXT ? (item.content || 'New Text') : 'Image'}
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                            className="p-1 rounded-full text-gray-400 hover:bg-red-500 hover:text-white flex-shrink-0"
                            title="Delete Layer"
                        >
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- CanvasEditor Component ---
interface CanvasEditorProps {
  canvasSize: CanvasSize;
  onBack: () => void;
}
const CanvasEditor: React.FC<CanvasEditorProps> = ({ canvasSize, onBack }) => {
    const [history, setHistory] = useState<CanvasItem[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const items = history[historyIndex];

    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('A high quality, photorealistic image based on this sketch.');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    const [viewState, setViewState] = useState({ zoom: 1, x: 0, y: 0 });
    const [activeTool, setActiveTool] = useState<ActiveTool>('select');
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isPanningRef = useRef(false);
    const panSessionRef = useRef({ mouseX: 0, mouseY: 0, viewX: 0, viewY: 0 });

    const updateItems = useCallback((newItems: CanvasItem[] | ((prevItems: CanvasItem[]) => CanvasItem[])) => {
        const currentItems = history[historyIndex];
        const resolvedNewItems = typeof newItems === 'function' ? newItems(currentItems) : newItems;

        // Prevent adding identical state to history
        if (JSON.stringify(resolvedNewItems) === JSON.stringify(currentItems)) {
            return;
        }

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(resolvedNewItems);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const getInitialViewState = useCallback(() => {
        if (!canvasContainerRef.current) return { zoom: 1, x: 0, y: 0 };
        const { clientWidth, clientHeight } = canvasContainerRef.current;
        const zoom = Math.min(
            clientWidth / canvasSize.width,
            clientHeight / canvasSize.height
        ) * 0.9;
        const x = (clientWidth - canvasSize.width * zoom) / 2;
        const y = (clientHeight - canvasSize.height * zoom) / 2;
        return { zoom, x, y };
    }, [canvasSize]);

    useEffect(() => {
        setViewState(getInitialViewState());
    }, [getInitialViewState, canvasSize]);


    const handleAddItem = (type: CanvasItemType) => {
        const newItem: CanvasItem = {
            id: Date.now().toString(),
            type,
            x: 50,
            y: 50,
            width: type === CanvasItemType.TEXT ? 150 : 200,
            height: type === CanvasItemType.TEXT ? 50 : 200,
            rotation: 0,
            content: type === CanvasItemType.TEXT ? 'New Text' : '',
            fontSize: 24,
            color: '#FFFFFF'
        };
        
        if (type === CanvasItemType.IMAGE) {
            fileInputRef.current?.click();
        } else {
            updateItems(prev => [...prev, newItem]);
            setSelectedItemId(newItem.id);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && canvasSize) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                const img = new Image();
                img.onload = () => {
                    const { naturalWidth, naturalHeight } = img;
                    const { width: canvasWidth, height: canvasHeight } = canvasSize;

                    const scale = Math.min(
                        canvasWidth / 2 / naturalWidth,
                        canvasHeight / 2 / naturalHeight,
                        1 
                    );

                    const newWidth = naturalWidth * scale;
                    const newHeight = naturalHeight * scale;

                    const newItem: CanvasItem = {
                        id: Date.now().toString(),
                        type: CanvasItemType.IMAGE,
                        x: (canvasWidth - newWidth) / 2,
                        y: (canvasHeight - newHeight) / 2,
                        width: newWidth,
                        height: newHeight,
                        rotation: 0,
                        content: imageUrl,
                    };
                    updateItems(prev => [...prev, newItem]);
                    setSelectedItemId(newItem.id);
                };
                img.src = imageUrl;
            };
            reader.readAsDataURL(file);
        }
        if(e.target) e.target.value = '';
    };

    const handleUpdateItem = useCallback((updatedItem: CanvasItem) => {
        updateItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    }, [updateItems]);

    const handleDeleteItem = useCallback((id: string) => {
        updateItems(prev => prev.filter(item => item.id !== id));
        setSelectedItemId(null);
    }, [updateItems]);

    const handleReorderItems = useCallback((dragIndexReversed: number, hoverIndexReversed: number) => {
        updateItems(prevItems => {
            const reversed = [...prevItems].reverse();
            const draggedItem = reversed[dragIndexReversed];
    
            const newReversed = [...reversed];
            newReversed.splice(dragIndexReversed, 1);
            newReversed.splice(hoverIndexReversed, 0, draggedItem);
            
            return newReversed.reverse();
        });
    }, [updateItems]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prevIndex => prevIndex - 1);
        }
    }, [historyIndex]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prevIndex => prevIndex + 1);
        }
    }, [historyIndex, history.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isEditingText = document.activeElement?.tagName === 'TEXTAREA';
            if (isEditingText) return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleUndo, handleRedo]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const { deltaY } = e;
        const zoomFactor = 0.95;
        const newZoom = deltaY > 0 ? viewState.zoom * zoomFactor : viewState.zoom / zoomFactor;
        const clampedZoom = Math.max(0.1, Math.min(newZoom, 5));

        if (!canvasContainerRef.current) return;
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldX = (mouseX - viewState.x) / viewState.zoom;
        const worldY = (mouseY - viewState.y) / viewState.zoom;

        const newX = mouseX - worldX * clampedZoom;
        const newY = mouseY - worldY * clampedZoom;

        setViewState({ zoom: clampedZoom, x: newX, y: newY });
    };

    const panMove = useCallback((e: MouseEvent) => {
        if (!isPanningRef.current) return;
        e.preventDefault();
        const dx = e.clientX - panSessionRef.current.mouseX;
        const dy = e.clientY - panSessionRef.current.mouseY;
        
        setViewState(prev => ({
            zoom: prev.zoom,
            x: panSessionRef.current.viewX + dx,
            y: panSessionRef.current.viewY + dy,
        }));
    }, []);

    const panEnd = useCallback(() => {
        isPanningRef.current = false;
        if (canvasContainerRef.current) {
            // Reset cursor style to allow the CSS class to take over
            canvasContainerRef.current.style.cursor = '';
        }
        window.removeEventListener('mousemove', panMove);
        window.removeEventListener('mouseup', panEnd);
    }, [panMove]);

    const panStart = useCallback((e: React.MouseEvent) => {
        // Middle mouse always pans, or left-click pans if Pan tool is active
        if (e.button === 1 || (e.button === 0 && activeTool === 'pan')) {
            e.preventDefault();
            isPanningRef.current = true;
            panSessionRef.current = { 
                mouseX: e.clientX, 
                mouseY: e.clientY,
                viewX: viewState.x,
                viewY: viewState.y,
            };
            if (canvasContainerRef.current) {
                canvasContainerRef.current.style.cursor = 'grabbing';
            }
            window.addEventListener('mousemove', panMove);
            window.addEventListener('mouseup', panEnd);
            return;
        }

        // Left-click on background with Select tool deselects items
        if (e.button === 0 && activeTool === 'select') {
            if (e.target === canvasContainerRef.current || e.target === canvasRef.current) {
                setSelectedItemId(null);
            }
        }
    }, [panMove, panEnd, activeTool, viewState.x, viewState.y]);
    
    const zoomToCenter = (newZoom: number) => {
        if (!canvasContainerRef.current) return;
        const clampedZoom = Math.max(0.1, Math.min(newZoom, 5));
        const { clientWidth, clientHeight } = canvasContainerRef.current;
        const centerX = clientWidth / 2;
        const centerY = clientHeight / 2;

        const worldX = (centerX - viewState.x) / viewState.zoom;
        const worldY = (centerY - viewState.y) / viewState.zoom;

        const newX = centerX - worldX * clampedZoom;
        const newY = centerY - worldY * clampedZoom;

        setViewState({ zoom: clampedZoom, x: newX, y: newY });
    };

    const togglePanMode = () => {
        setActiveTool(prev => prev === 'pan' ? 'select' : 'pan');
    };

    const handleGenerate = async () => {
        if (!canvasRef.current) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setSelectedItemId(null);

        const textItems = items.filter(item => item.type === CanvasItemType.TEXT);
        const textContents = textItems.map(item => item.content).filter(content => content.trim() !== '' && content !== 'New Text');

        const generationInstructions = `You are an AI image generator. Your task is to interpret a rough sketch and a text prompt to create a high-quality image.

**Input Sketch Analysis:**
- The provided image is a compositional sketch.
- The dimensions of the sketch are exactly ${canvasSize.width}x${canvasSize.height} pixels.

**Critical Output Requirements:**
1.  **Fill Entire Canvas:** The generated image MUST completely fill the entire ${canvasSize.width}x${canvasSize.height} area. The content must extend to all four edges of the image.
2.  **No Borders or Empty Space:** Do NOT add any borders, margins, padding, or leave any part of the canvas empty. The image composition should be complete within the given dimensions.
3.  **Adhere to Layout:** Use the positions of elements in the sketch as a strong guide for the final composition.

**User's Creative Prompt:**
${prompt}
`;
        let finalPrompt = generationInstructions;
        
        if (textContents.length > 0) {
            finalPrompt += `\n\n**Thematic Guidance from Text on Canvas:**
- The following text was included in the sketch. Interpret its meaning and themes to influence the mood, style, and subject matter of the image.
- **DO NOT** render these words literally in the image.
- Text to interpret: "${textContents.join('", "')}"`;
        }

        const originalNode = canvasRef.current;
        const clonedNode = originalNode.cloneNode(true) as HTMLElement;

        // Reset transform on the clone and position it off-screen to capture at 1:1 scale without visual flicker
        clonedNode.style.transform = '';
        clonedNode.style.position = 'absolute';
        clonedNode.style.left = '-9999px';
        clonedNode.style.top = '-9999px';
        clonedNode.style.width = `${canvasSize.width}px`;
        clonedNode.style.height = `${canvasSize.height}px`;

        // Replace text elements in the clone with placeholder boxes to represent their layout
        const textElementsInClone: HTMLElement[] = Array.from(clonedNode.querySelectorAll('[data-type="text"]'));
        textElementsInClone.forEach(el => {
            // Clear content and apply placeholder styles
            el.innerHTML = '';
            el.style.visibility = 'visible';
            el.style.backgroundColor = 'rgba(128, 128, 128, 0.2)'; // A neutral placeholder color
            el.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
        });

        document.body.appendChild(clonedNode);

        try {
            // A small delay for the off-screen element to be ready for capture
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const canvas = await html2canvas(clonedNode, {
                backgroundColor: '#1f2937',
                logging: false,
                useCORS: true,
                scale: 1,
                width: canvasSize.width,
                height: canvasSize.height,
            });
            const base64Image = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
            
            const result = await generateImageFromSketch(base64Image, finalPrompt);
            setGeneratedImage(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            document.body.removeChild(clonedNode);
            setIsLoading(false);
        }
    };

    const handleDownloadImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = 'ai-sketch-result.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full h-screen flex flex-col items-center justify-start p-4 bg-gray-900 gap-4">
            <div className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0">
                <button onClick={onBack} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                    &larr; Change Resolution
                </button>
                <div className="flex items-center gap-3 bg-gray-800 px-3 py-1 rounded-lg">
                    <div className="flex">
                        <button
                            onClick={handleUndo}
                            disabled={historyIndex === 0}
                            title="Undo (Ctrl+Z)"
                            className="p-2 rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                        >
                            <UndoIcon className="w-5 h-5"/>
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            title="Redo (Ctrl+Y)"
                            className="p-2 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                        >
                            <RedoIcon className="w-5 h-5"/>
                        </button>
                    </div>
                    <div className="h-6 w-px bg-gray-700 mx-1"></div>
                    <button
                        onClick={togglePanMode}
                        title={activeTool === 'pan' ? 'Switch to Select Tool' : 'Switch to Pan Tool'}
                        className={`p-2 rounded-md ${activeTool === 'pan' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}
                    >
                        <MoveIcon className="w-5 h-5"/>
                    </button>
                    <div className="h-6 w-px bg-gray-700 mx-1"></div>
                    <button onClick={() => zoomToCenter(viewState.zoom * 0.8)} title="Zoom Out" className="p-1 hover:bg-gray-700 rounded-full"><ZoomOutIcon className="w-5 h-5"/></button>
                    <input type="range" min="0.1" max="5" step="0.01" value={viewState.zoom} onChange={e => zoomToCenter(parseFloat(e.target.value))} className="w-32 accent-indigo-500"/>
                    <button onClick={() => zoomToCenter(viewState.zoom * 1.25)} title="Zoom In" className="p-1 hover:bg-gray-700 rounded-full"><ZoomInIcon className="w-5 h-5"/></button>
                    <button onClick={() => setViewState(getInitialViewState())} className="text-sm font-mono px-2 py-1 hover:bg-gray-700 rounded">{Math.round(viewState.zoom * 100)}%</button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleAddItem(CanvasItemType.TEXT)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"><TextIcon /> Add Text</button>
                    <button onClick={() => handleAddItem(CanvasItemType.IMAGE)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"><ImageIcon /> Add Image</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
            </div>

            <div className="flex flex-row items-start justify-center gap-6 w-full max-w-7xl flex-grow min-h-0">
                {/* Layers Panel */}
                 <LayersPanel
                    items={items}
                    selectedItemId={selectedItemId}
                    onSelectItem={setSelectedItemId}
                    onDeleteItem={handleDeleteItem}
                    onReorderItems={handleReorderItems}
                />

                {/* Canvas Area */}
                <div 
                    ref={canvasContainerRef}
                    className="flex-grow h-full bg-black/20 rounded-lg overflow-hidden p-0 flex items-start justify-start"
                    onWheel={handleWheel}
                    onMouseDown={panStart}
                >
                    <div
                        ref={canvasRef}
                        className={`relative bg-gray-800 overflow-hidden shadow-2xl flex-shrink-0 ${activeTool === 'pan' ? 'cursor-grab' : 'cursor-default'}`}
                        style={{
                            width: canvasSize.width,
                            height: canvasSize.height,
                            transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.zoom})`,
                            transformOrigin: 'top left',
                         }}
                    >
                        {items.map((item, index) => (
                            <CanvasItemComponent
                                key={item.id}
                                item={item}
                                onUpdate={handleUpdateItem}
                                onDelete={handleDeleteItem}
                                isSelected={selectedItemId === item.id}
                                onSelect={setSelectedItemId}
                                canvasRef={canvasRef}
                                zoom={viewState.zoom}
                                activeTool={activeTool}
                            />
                        ))}
                    </div>
                </div>

                {/* Controls & Result */}
                <div className="w-80 flex-shrink-0 flex flex-col gap-4 bg-gray-800 p-4 rounded-lg h-full overflow-y-auto">
                    <h3 className="text-lg font-semibold">Generation Controls</h3>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your prompt here..."
                        rows={4}
                        className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Generating...' : 'Generate Image'}
                    </button>
                    
                    {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</div>}

                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Result</h3>
                        <div className="relative w-full aspect-square bg-gray-700 rounded-lg flex items-center justify-center group">
                            {isLoading && <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>}
                            {generatedImage && <img src={generatedImage} alt="Generated result" className="w-full h-full object-contain rounded-lg" />}
                            {!isLoading && !generatedImage && <p className="text-gray-400">Your generated image will appear here.</p>}
                            
                            {generatedImage && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button onClick={() => setIsPreviewOpen(true)} className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-gray-700/80" title="View larger">
                                        <ZoomInIcon className="w-6 h-6" />
                                    </button>
                                    <button onClick={handleDownloadImage} className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-gray-700/80" title="Download image">
                                        <DownloadIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isPreviewOpen && generatedImage && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsPreviewOpen(false)}>
                    <div className="relative max-w-4xl max-h-[90vh] bg-gray-900 p-2 rounded-lg" onClick={(e) => e.stopPropagation()}>
                        <img src={generatedImage} alt="Generated result preview" className="max-w-full max-h-[calc(90vh-1rem)] object-contain" />
                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute -top-4 -right-4 w-10 h-10 bg-red-600 rounded-full text-white flex items-center justify-center hover:bg-red-500 transition-colors text-2xl font-bold"
                            aria-label="Close preview"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- ResolutionSelector Component ---
interface ResolutionSelectorProps {
  onCanvasCreate: (size: CanvasSize) => void;
}
const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({ onCanvasCreate }) => {
    const presets = [
        { name: 'Square (1:1)', w: 768, h: 768, ar: '1:1' },
        { name: 'Portrait (9:16)', w: 576, h: 1024, ar: '9:16' },
        { name: 'Landscape (16:9)', w: 1024, h: 576, ar: '16:9' },
    ];
    const [customWidth, setCustomWidth] = useState(1024);
    const [customHeight, setCustomHeight] = useState(1024);

    const handleCreateCustom = (e: React.FormEvent) => {
        e.preventDefault();
        onCanvasCreate({ width: customWidth, height: customHeight, aspectRatio: `${customWidth}:${customHeight}` });
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">AI Sketch Canvas</h1>
                    <p className="text-gray-400">
                        АВТОР <a href="https://t.me/razzboyniki" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">ЭЛЬНУР АББАСОВ</a>
                    </p>
                </header>

                <div className="w-full bg-gray-800 rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-center mb-8">Choose a canvas size to start creating.</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {presets.map(p => (
                            <button key={p.name} onClick={() => onCanvasCreate({ width: p.w, height: p.h, aspectRatio: p.ar })} className="p-6 bg-gray-700 rounded-lg hover:bg-indigo-600 hover:scale-105 transition-all duration-200">
                                <div className="font-semibold">{p.name}</div>
                                <div className="text-sm text-gray-400">{p.w} x {p.h}</div>
                            </button>
                        ))}
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-center mb-4 border-t border-gray-700 pt-6">Or use a custom size</h3>
                        <form onSubmit={handleCreateCustom} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <input type="number" value={customWidth} onChange={e => setCustomWidth(parseInt(e.target.value, 10))} className="w-full sm:w-32 p-2 bg-gray-700 rounded-md text-center" min="128" max="2048" />
                            <span className="text-gray-500">x</span>
                            <input type="number" value={customHeight} onChange={e => setCustomHeight(parseInt(e.target.value, 10))} className="w-full sm:w-32 p-2 bg-gray-700 rounded-md text-center" min="128" max="2048" />
                            <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition-colors">Create</button>
                        </form>
                    </div>
                </div>
                
                <footer className="w-full flex flex-col sm:flex-row justify-center items-center gap-4 pt-8">
                    <a href="https://boosty.to/abbasovsoft/donate" target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors w-full sm:w-auto text-center">
                        Поддержи автора донатом
                    </a>
                    <a href="https://boosty.to/abbasovsoft" target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors w-full sm:w-auto text-center">
                        Уроки Pinterest
                    </a>
                </footer>
            </div>
        </div>
    );
};

// --- Main App Component ---
function App() {
  const [canvasSize, setCanvasSize] = useState<CanvasSize | null>(null);

  const handleCanvasCreate = (size: CanvasSize) => {
    setCanvasSize(size);
  };

  const handleGoBack = () => {
    setCanvasSize(null);
  }

  return (
    <>
      {!canvasSize ? (
        <ResolutionSelector onCanvasCreate={handleCanvasCreate} />
      ) : (
        <CanvasEditor canvasSize={canvasSize} onBack={handleGoBack} />
      )}
    </>
  );
}

export default App;
