import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { StackResponse } from '../../services/api';
import { Plus, FolderOpen, LogOut, Search, Trash2 } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
  onOpenWorkflow: (stackId: string) => void;
  onCreateWorkflow: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, onOpenWorkflow }) => {
  const [stacks, setStacks] = useState<StackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateStack, setShowCreateStack] = useState(false);
  const [newStackName, setNewStackName] = useState('');
  const [newStackDescription, setNewStackDescription] = useState('');
  const [deletingStackId, setDeletingStackId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stackToDelete, setStackToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadStacks();
  }, []);

  const loadStacks = async () => {
    try {
      setLoading(true);
      const userStacks = await apiService.getUserStacks();
      setStacks(userStacks);
    } catch (error) {
      console.error('Failed to load stacks:', error);
      // Don't show error if it's just authentication issue
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        setStacks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStack = async () => {
    if (!newStackName.trim()) return;

    try {
      const newStack = await apiService.createStack({
        name: newStackName,
        description: newStackDescription || undefined
      });
      
      setStacks(prev => [newStack, ...prev]);
      setNewStackName('');
      setNewStackDescription('');
      setShowCreateStack(false);
    } catch (error) {
      console.error('Failed to create stack:', error);
    }
  };

  const handleDeleteStack = async (stackId: string, stackName: string) => {
    setStackToDelete({ id: stackId, name: stackName });
    setShowDeleteModal(true);
  };

  const confirmDeleteStack = async () => {
    if (!stackToDelete) return;

    try {
      setDeletingStackId(stackToDelete.id);
      await apiService.deleteStack(stackToDelete.id);
      setStacks(prev => prev.filter(stack => stack.id !== stackToDelete.id));
      setShowDeleteModal(false);
      setStackToDelete(null);
    } catch (error) {
      console.error('Failed to delete stack:', error);
      setErrorMessage('Failed to delete stack. Please try again.');
      setShowErrorModal(true);
    } finally {
      setDeletingStackId(null);
    }
  };

  const cancelDeleteStack = () => {
    setShowDeleteModal(false);
    setStackToDelete(null);
  };

  const filteredStacks = stacks.filter(stack =>
    stack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (stack.description && stack.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-emerald-600">AI Planet</h1>
              </div>
            </div>
            
            <div className="flex items-center">
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors px-3 py-2 rounded-md hover:bg-slate-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to AI Planet</h2>
          <p className="text-slate-600">Create and manage your AI workflow stacks</p>
        </div>

        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search stacks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          <button
            onClick={() => setShowCreateStack(true)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Stack</span>
          </button>
        </div>

        {/* Create Stack Modal */}
        {showCreateStack && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create New Stack</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Stack Name *
                  </label>
                  <input
                    type="text"
                    value={newStackName}
                    onChange={(e) => setNewStackName(e.target.value)}
                    placeholder="Enter stack name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newStackDescription}
                    onChange={(e) => setNewStackDescription(e.target.value)}
                    placeholder="Describe your stack"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateStack(false)}
                  className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStack}
                  disabled={!newStackName.trim()}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Stack
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && stackToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Delete Stack</h3>
                  <p className="text-sm text-slate-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-slate-700">
                  Are you sure you want to delete <span className="font-semibold text-slate-900">"{stackToDelete.name}"</span>?
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  This will permanently remove the stack and all its workflows, chats, and data.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteStack}
                  disabled={deletingStackId === stackToDelete.id}
                  className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteStack}
                  disabled={deletingStackId === stackToDelete.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingStackId === stackToDelete.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete Stack'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <div className="w-6 h-6 text-red-600">⚠️</div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Error</h3>
                  <p className="text-sm text-slate-600">Something went wrong</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-slate-700">{errorMessage}</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stacks Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredStacks.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? 'No stacks found' : 'No stacks yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first stack to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateStack(true)}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Stack</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStacks.map((stack) => (
              <div
                key={stack.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 
                      className="text-lg font-semibold text-slate-900 truncate cursor-pointer hover:text-emerald-600 transition-colors"
                      onClick={() => onOpenWorkflow(stack.id)}
                    >
                      {stack.name}
                    </h3>
                    <div className="flex items-center space-x-4">
                      <FolderOpen 
                        className="w-5 h-5 text-emerald-600 flex-shrink-0 cursor-pointer hover:text-emerald-700 transition-colors" 
                        onClick={() => onOpenWorkflow(stack.id)}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStack(stack.id, stack.name);
                        }}
                        disabled={deletingStackId === stack.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete stack"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {stack.description && (
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {stack.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Updated {formatDate(stack.updated_at)}</span>
                    <span>Created {formatDate(stack.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
