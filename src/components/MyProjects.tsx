import { useState, useEffect } from 'react';
import { Plus, Trash2, Play, Loader, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useKYCStatus } from '../hooks/useKYCStatus';
import { KYCStatusBanner } from './KYCStatusBanner';
import { KYCModal } from './modals/KYCModal';

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  state: Record<string, unknown>;
}

interface MyProjectsProps {
  onNavigate?: (page: string, projectId?: string) => void;
}

export function MyProjects({ onNavigate }: MyProjectsProps) {
  const { user, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [showKYC, setShowKYC] = useState(false);

  const { kycStatus, startKYCSession, refetch } = useKYCStatus();

  useEffect(() => {
    if (!user) return;
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProjects(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      setError('Project name cannot be empty');
      return;
    }

    try {
      setCreatingProject(true);
      setError('');
      const { data, error: createError } = await supabase
        .from('projects')
        .insert([
          {
            name: newProjectName,
            user_id: user?.id,
            state: {},
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      setNewProjectName('');
      setProjects([data, ...projects]);

      if (onNavigate) {
        onNavigate('create', data.id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingProject(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;

      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const openProject = (projectId: string) => {
    if (onNavigate) {
      onNavigate('create', projectId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const { error } = await signOut();
      if (error) {
        setError(error);
      } else {
        if (onNavigate) onNavigate('create');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24">
      <section className="py-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-[1440px] mx-auto">
          {user && (
            <div className="mb-6">
              <KYCStatusBanner kycStatus={kycStatus} onStartKYC={() => setShowKYC(true)} />
            </div>
          )}

          {user && (
            <div className="mb-8 flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div>
                <p className="text-xs text-gray-400 mb-1">Logged in as</p>
                <p className="text-sm font-semibold text-white">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 text-sm font-chakra uppercase tracking-wider text-gray-500 hover:text-red-400 disabled:text-gray-600 disabled:cursor-not-allowed transition px-4 py-2 rounded-lg hover:bg-gray-800 disabled:hover:bg-transparent border border-transparent hover:border-red-500/30 disabled:border-transparent"
              >
                {loggingOut ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                {loggingOut ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          )}

          <div className="mb-12">
            <h1 className="font-krona text-4xl md:text-5xl lg:text-6xl mb-4">
              My <span className="text-[#E70606]">Projects</span>
            </h1>
            <p className="text-gray-400 font-jost text-lg max-w-2xl">
              Create new projects or continue working on your existing animations.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <div className="mb-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-white">Create New Project</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                onKeyPress={(e) => e.key === 'Enter' && createProject()}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#E70606] transition"
              />
              <button
                onClick={createProject}
                disabled={creatingProject}
                className="bg-[#E70606] hover:bg-[#c00505] disabled:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                {creatingProject && <Loader className="w-4 h-4 animate-spin" />}
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-[#E70606]" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">No projects yet</p>
              <p className="text-gray-500">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-[#E70606] transition-all hover:shadow-xl hover:shadow-[#E70606]/20"
                >
                  <h3 className="text-xl font-bold text-white mb-2 truncate">
                    {project.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Created {formatDate(project.created_at)}
                  </p>
                  <p className="text-gray-500 text-xs mb-4">
                    Last updated {formatDate(project.updated_at)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openProject(project.id)}
                      className="flex-1 bg-[#E70606] hover:bg-[#c00505] text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Open
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="bg-gray-700 hover:bg-red-900 text-white px-4 py-2 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <KYCModal
        isOpen={showKYC}
        onClose={() => setShowKYC(false)}
        onStartKYC={startKYCSession}
        onKYCComplete={() => { refetch(); setShowKYC(false); }}
      />
    </div>
  );
}
