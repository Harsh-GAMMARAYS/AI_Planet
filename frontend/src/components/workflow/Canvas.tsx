import React, { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type OnConnect,
  type Node,
  type Edge,
} from '@xyflow/react';
import { UserQueryNode } from './nodes/UserQueryNode';
import { LLMEngineNode } from './nodes/LLMEngineNode';
import { KnowledgeBaseNode } from './nodes/KnowledgeBaseNode';
import { WebSearchNode } from './nodes/WebSearchNode';
import { OutputNode } from './nodes/OutputNode';
import { Play, MessageCircle, MousePointer, Save } from 'lucide-react';
import '@xyflow/react/dist/style.css';

interface CanvasProps {
  onChatWithStack: (workflowData?: { nodes: any[]; edges: any[] }) => void;
  onNodeSelect: (nodeId: string, nodeType: string) => void;
  nodeConfigs: Record<string, any>;
  onNodeConfigUpdate?: (nodeId: string, key: string, value: any) => void;
  onBuildStack?: (isValid: boolean, errors: string[], workflowData?: { nodes: any[]; edges: any[] }) => void;
  onSaveWorkflow?: (workflowData?: { nodes: any[]; edges: any[] }) => void;
  outputNodeData?: string;
  initialWorkflowData?: { nodes: any[]; edges: any[]; nodeConfigs?: Record<string, any> };
}

// Initial empty state
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const CanvasInner: React.FC<CanvasProps> = ({ onChatWithStack, onNodeSelect, nodeConfigs, onNodeConfigUpdate, onBuildStack, onSaveWorkflow, outputNodeData, initialWorkflowData }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Debug edge changes
  const debugOnEdgesChange = useCallback((changes: any) => {
    console.log('🔗 Edge changes:', changes);
    onEdgesChange(changes);
  }, [onEdgesChange]);
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Get current workflow data
  const getCurrentWorkflowData = useCallback(() => {
    return {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node.data,
          config: nodeConfigs[node.id] || {}
        }
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label
      })),
      nodeConfigs: nodeConfigs
    };
  }, [nodes, edges, nodeConfigs]);



  // Node configurations are handled by individual node components

  // Monitor nodes and edges for debugging
  React.useEffect(() => {
    console.log('🔍 Canvas state:', { nodes: nodes.length, edges: edges.length });
    if (edges.length > 0) {
      console.log('🔍 Current edges:', edges);
    }
  }, [nodes, edges]);

  // Load initial workflow data when component mounts or data changes
  React.useEffect(() => {
    if (initialWorkflowData && initialWorkflowData.nodes && initialWorkflowData.nodes.length > 0) {
      console.log('🔄 Loading initial workflow data:', {
        nodes: initialWorkflowData.nodes.length,
        edges: initialWorkflowData.edges?.length || 0
      });
      
      // Convert the workflow data to React Flow format
      const reactFlowNodes = initialWorkflowData.nodes.map(node => ({
        id: node.id, // Use the ID from the database
        type: node.type,
        position: node.position || { x: 0, y: 0 },
        data: {
          ...node.data,
          config: nodeConfigs[node.id] || {},
          nodeConfigs: nodeConfigs // Pass nodeConfigs through data
        }
      }));
      
      console.log('🔍 React Flow Nodes:', reactFlowNodes.map(n => ({ id: n.id, type: n.type })));
      
      const reactFlowEdges = (initialWorkflowData.edges || []).map(edge => ({
        id: edge.id || `edge-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'default', // Ensure edge type is set
        animated: false,
        style: { stroke: '#333', strokeWidth: 2 }
      }));
      
      console.log('🔍 React Flow Edges with style:', reactFlowEdges);
      
      console.log('🔍 React Flow Edges:', reactFlowEdges);
      
      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
      
      console.log('✅ Workflow loaded successfully');
    }
    // Don't clear the canvas if no workflow data - let it stay empty naturally
  }, [initialWorkflowData, setNodes, setEdges]); // Removed nodeConfigs dependency

  // Update node configurations without reloading the entire workflow
  React.useEffect(() => {
    if (nodes.length > 0) {
      setNodes((nds) => 
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            config: nodeConfigs[node.id] || {},
            nodeConfigs: nodeConfigs
          }
        }))
      );
    }
  }, [nodeConfigs, nodes.length]);

  // Update Output node when workflow results are available
  React.useEffect(() => {
    if (!outputNodeData) return;
    setNodes((nds) => 
      nds.map((node) => {
        if (node.type !== 'output') return node;
        const existingText = (node.data && (node.data as any).outputText) as string | undefined;
        if (existingText === outputNodeData) {
          return node; // avoid redundant updates that can cause loops
        }
        return {
          ...node,
          data: {
            ...node.data,
            outputText: outputNodeData,
            onOpenChat: () => onChatWithStack(getCurrentWorkflowData())
          },
        };
      })
    );
  }, [outputNodeData]);

  // Define custom node types - memoized to prevent node recreation
  const nodeTypes = useMemo(() => ({
    'user-query': UserQueryNode,
    'knowledge-base': KnowledgeBaseNode,
    'llm-openai': LLMEngineNode,
    'web-search': WebSearchNode,
    'output': OutputNode,
  }), []);

  const onConnect: OnConnect = useCallback(
    (params) => {
      console.log('🔗 New connection:', params);
      setEdges((eds) => {
        const newEdges = addEdge(params, eds);
        console.log('🔗 Updated edges:', newEdges);
        return newEdges;
      });
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    onNodeSelect(node.id, node.type || 'default');
  }, [onNodeSelect]);

  // Listen for node deletion events
  React.useEffect(() => {
    const handleRemoveNode = (event: any) => {
      const { nodeId } = event.detail;
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    };

    window.addEventListener('deleteNode', handleRemoveNode);
    return () => window.removeEventListener('deleteNode', handleRemoveNode);
  }, [setNodes, setEdges]);

  // Listen for node configuration updates - only update parent state, not React Flow nodes
  React.useEffect(() => {
    const handleUpdateNodeConfig = (event: any) => {
      const { nodeId, key, value } = event.detail;
      console.log('🔍 Canvas received updateNodeConfig:', { nodeId, key, value });
      
      // Only update the nodeConfigs state in the parent component
      // Don't update React Flow nodes to prevent edge loss
      if (onNodeConfigUpdate) {
        onNodeConfigUpdate(nodeId, key, value);
      }
    };

    window.addEventListener('updateNodeConfig', handleUpdateNodeConfig);
    return () => window.removeEventListener('updateNodeConfig', handleUpdateNodeConfig);
  }, [onNodeConfigUpdate]);



  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Workflow validation function
  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];
    
    // Check if there are any nodes
    if (nodes.length === 0) {
      errors.push("No components added to the workflow");
      return { isValid: false, errors };
    }

    // Check if there's a User Query node
    const userQueryNodes = nodes.filter(node => node.type === 'user-query');
    if (userQueryNodes.length === 0) {
      errors.push("Missing User Query component");
    } else if (userQueryNodes.length > 1) {
      errors.push("Multiple User Query components found (only one allowed)");
    }

    // Check if there's an Output node
    const outputNodes = nodes.filter(node => node.type === 'output');
    if (outputNodes.length === 0) {
      errors.push("Missing Output component");
    } else if (outputNodes.length > 1) {
      errors.push("Multiple Output components found (only one allowed)");
    }

    // Check for circular references
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true;
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // Check for cycles starting from each node
    for (const node of nodes) {
      if (hasCycle(node.id)) {
        errors.push("Circular reference detected in workflow");
        break;
      }
    }

    // Check for disconnected nodes (nodes with no connections)
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const disconnectedNodes = nodes.filter(node => !connectedNodes.has(node.id));
    if (disconnectedNodes.length > 0) {
      errors.push(`Disconnected components: ${disconnectedNodes.map(n => n.data.label).join(', ')}`);
    }

    // Check for orphaned edges (edges pointing to non-existent nodes)
    const nodeIds = new Set(nodes.map(node => node.id));
    const orphanedEdges = edges.filter(edge => 
      !nodeIds.has(edge.source) || !nodeIds.has(edge.target)
    );
    if (orphanedEdges.length > 0) {
      errors.push("Invalid connections found");
    }

    // Check if User Query can reach Output
    const canReachOutput = (startNodeId: string): boolean => {
      const visited = new Set<string>();
      const queue = [startNodeId];
      
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        
        const currentNode = nodes.find(n => n.id === currentId);
        if (currentNode?.type === 'output') {
          return true;
        }
        
        const outgoingEdges = edges.filter(edge => edge.source === currentId);
        for (const edge of outgoingEdges) {
          queue.push(edge.target);
        }
      }
      
      return false;
    };

    const userQueryNode = userQueryNodes[0];
    if (userQueryNode && !canReachOutput(userQueryNode.id)) {
      errors.push("User Query cannot reach Output component");
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }, [nodes, edges]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const componentId = event.dataTransfer.getData('application/reactflow');
      if (typeof componentId === 'undefined' || !componentId) {
        return;
      }

      // Map component IDs to their display info
      const componentMap: Record<string, { name: string; icon: string; color: string }> = {
        'user-query': { name: 'User Query', icon: '👤', color: '#3b82f6' },
        'llm-openai': { name: 'LLM (OpenAI)', icon: '🤖', color: '#8b5cf6' },
        'knowledge-base': { name: 'Knowledge Base', icon: '📚', color: '#f59e0b' },
        'web-search': { name: 'Web Search', icon: '🌐', color: '#06b6d4' },
        'output': { name: 'Output', icon: '📤', color: '#ef4444' }
      };

      const componentInfo = componentMap[componentId];
      if (!componentInfo) return;

      // Use React Flow's screen-to-flow position conversion
      // This accounts for zoom, pan, and canvas transformations
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${componentId}-${Date.now()}`,
        type: componentId,
        position,
        data: {
          label: componentInfo.name,
          config: nodeConfigs[`${componentId}-${Date.now()}`] || {},
          nodeConfigs: nodeConfigs, // Pass nodeConfigs to new nodes
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  return (
    <main className="flex-1 flex flex-col relative h-full">
      <div className="flex-1 bg-slate-50 m-4 rounded-lg border border-slate-200 flex items-center justify-center relative min-h-[calc(100vh-120px)]" style={{ height: '100%' }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={debugOnEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1.0 }}
          fitView={true}
          fitViewOptions={{ padding: 0.2 }}
          snapToGrid={false}
          snapGrid={[1, 1]}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
          <Controls 
            className="!absolute !bottom-4 !left-1/2 !transform !-translate-x-1/2 !bg-white !border !border-slate-200 !rounded-xl !shadow-xl !flex !flex-row !items-center !p-2 !gap-1.5"
            style={{
              '--react-flow__controls-button-bg': 'white',
              '--react-flow__controls-button-color': '#374151',
              '--react-flow__controls-button-border': 'none',
              '--react-flow__controls-button-border-radius': '8px',
              '--react-flow__controls-button-width': '64px',
              '--react-flow__controls-button-height': '64px',
              '--react-flow__controls-button-hover-bg': '#f1f5f9',
              '--react-flow__controls-button-hover-color': '#111827',
            } as React.CSSProperties}
          />
        </ReactFlow>
        
        {nodes.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-slate-500 pointer-events-none z-10">
            <div className="mb-6 flex justify-center items-center">
              <div className="w-20 h-20 border-2 border-dashed border-emerald-500 rounded-full flex items-center justify-center">
                <MousePointer className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-2xl mb-2 text-slate-800 font-semibold">Drag & drop to get started</h3>
          </div>
        )}
        

      </div>
      
      <div className="absolute bottom-5 right-5 flex flex-col gap-4 z-[1000]">
        <div className="relative group">
          <button 
            className="w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-lg text-white text-2xl bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-xl"
            onClick={() => {
              const validation = validateWorkflow();
              if (onBuildStack) {
                onBuildStack(validation.isValid, validation.errors, getCurrentWorkflowData());
              }
            }}
          >
            <Play className="w-8 h-8" />
          </button>
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            <span className="text-sm font-medium text-slate-700">Build Stack</span>
          </div>
        </div>
        
        <div className="relative group">
          <button 
            className="w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-lg text-white text-2xl bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-xl"
            onClick={() => {
              if (onSaveWorkflow) {
                onSaveWorkflow(getCurrentWorkflowData());
              }
            }}
          >
            <Save className="w-8 h-8" />
          </button>
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            <span className="text-sm font-medium text-slate-700">Save Workflow</span>
          </div>
        </div>
        
        <div className="relative group">
          <button 
            className="w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-lg text-white text-2xl bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-xl"
            onClick={() => onChatWithStack(getCurrentWorkflowData())} 
          >
            <MessageCircle className="w-8 h-8" />
          </button>
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            <span className="text-sm font-medium text-slate-700">Chat with Stack</span>
          </div>
        </div>
      </div>
    </main>
  );
};

// Wrapper component to provide ReactFlow context
export const Canvas: React.FC<CanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
};
