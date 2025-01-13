import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface SnapshotsProps {
  connectionId: string;
}

interface SnapshotRepository {
  name: string;
  type: string;
  settings: any;
}

interface Snapshot {
  snapshot: string;
  state: string;
  start_time: string;
  end_time?: string;
  duration_in_millis?: number;
  indices: string[];
  shards: {
    total: number;
    failed: number;
    successful: number;
  };
}

export function Snapshots({ connectionId }: SnapshotsProps) {
  const [repositories, setRepositories] = useState<SnapshotRepository[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<string>('');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [showCreateSnapshot, setShowCreateSnapshot] = useState(false);
  const [indices, setIndices] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<string>>(new Set());

  // 表单状态
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoType, setNewRepoType] = useState('fs');
  const [newRepoLocation, setNewRepoLocation] = useState('');
  const [newSnapshotName, setNewSnapshotName] = useState('');

  useEffect(() => {
    console.log('Initial load triggered by connectionId change:', connectionId);
    refreshRepositories();
    loadIndices();
  }, [connectionId]);

  useEffect(() => {
    if (selectedRepository) {
      loadSnapshots(selectedRepository);
    }
  }, [selectedRepository]);

  const loadRepositories = async () => {
    try {
      console.log('Starting to load repositories...');
      console.log('Connection ID:', connectionId);
      
      setLoading(true);
      setError(null);
      
      const repos = await invoke<SnapshotRepository[]>('list_snapshot_repositories', { connectionId });
      console.log('Raw response from backend:', repos);
      
      if (!Array.isArray(repos)) {
        console.error('Unexpected response format:', repos);
        setError('Unexpected response format from server');
        return;
      }
      
      if (repos.length === 0) {
        console.log('No repositories found');
      } else {
        console.log('Found repositories:', repos);
      }
      
      setRepositories(repos);
      
      if (repos.length > 0) {
        if (!selectedRepository) {
          console.log('Setting default repository:', repos[0].name);
          setSelectedRepository(repos[0].name);
        } else {
          console.log('Keeping current selected repository:', selectedRepository);
        }
      } else {
        console.log('No repositories to select');
        setSelectedRepository('');
      }
    } catch (err) {
      console.error('Failed to load repositories:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // 添加一个立即加载的函数
  const refreshRepositories = () => {
    console.log('Triggering repository refresh');
    loadRepositories().catch(err => {
      console.error('Failed to refresh repositories:', err);
    });
  };

  const loadSnapshots = async (repository: string) => {
    try {
      setLoading(true);
      setError(null);
      const snaps = await invoke<Snapshot[]>('list_snapshots', { connectionId, repository });
      setSnapshots(snaps);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadIndices = async () => {
    try {
      const indexList = await invoke<Array<{ name: string }>>('list_indices', { connectionId });
      setIndices(indexList.map(idx => idx.name));
    } catch (err) {
      console.error('Failed to load indices:', err);
    }
  };

  const handleCreateRepository = async () => {
    try {
      if (!newRepoName.trim()) {
        setError('仓库名称不能为空');
        return;
      }

      if (newRepoType === 'fs' && !newRepoLocation.trim()) {
        setError('存储位置不能为空');
        return;
      }

      setLoading(true);
      setError(null);
      console.log('Creating repository with params:', {
        connectionId,
        name: newRepoName,
        type: newRepoType,
        location: newRepoLocation
      });

      const settings = {
        location: newRepoLocation,
        compress: true
      };

      await invoke('create_snapshot_repository', {
        connectionId,
        name: newRepoName,
        type: newRepoType,
        settings
      });

      console.log('Repository created successfully');

      // 清空表单
      setNewRepoName('');
      setNewRepoLocation('');
      setShowCreateRepo(false);
      
      // 重新加载仓库列表
      console.log('Reloading repositories after creation');
      await loadRepositories();
      
      // 选择新创建的仓库
      console.log('Setting newly created repository as selected:', newRepoName);
      setSelectedRepository(newRepoName);

      // 显示成功消息
      alert(`仓库创建成功。\n\n注意：如果使用文件系统类型，请确保：\n1. 路径 ${newRepoLocation} 在 Elasticsearch 节点上存在并可写\n2. 该路径已在 elasticsearch.yml 中的 path.repo 配置中列为允许的仓库路径`);
    } catch (err) {
      console.error('Failed to create repository:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      setLoading(true);
      setError(null);
      const selectedIndicesArray = Array.from(selectedIndices);
      await invoke('create_snapshot', {
        connectionId,
        repository: selectedRepository,
        snapshot: newSnapshotName,
        indices: selectedIndicesArray.length > 0 ? selectedIndicesArray : null
      });
      setShowCreateSnapshot(false);
      loadSnapshots(selectedRepository);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSnapshot = async (snapshot: string) => {
    if (!confirm(`确定要删除快照 ${snapshot} 吗？`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await invoke('delete_snapshot', {
        connectionId,
        repository: selectedRepository,
        snapshot
      });
      loadSnapshots(selectedRepository);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSnapshot = async (snapshot: string) => {
    if (!confirm(`确定要恢复快照 ${snapshot} 吗？`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await invoke('restore_snapshot', {
        connectionId,
        repository: selectedRepository,
        snapshot,
        indices: null // 恢复所有索引
      });
      alert('快照恢复已开始，请稍后检查集群状态');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatDuration = (millis?: number) => {
    if (!millis) return '-';
    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`;
    }
    if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <select
                value={selectedRepository}
                onChange={(e) => setSelectedRepository(e.target.value)}
                className="mt-1 block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">选择仓库</option>
                {repositories.map((repo) => (
                  <option key={repo.name} value={repo.name}>
                    {repo.name} ({repo.type})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCreateRepo(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                创建仓库
              </button>
            </div>
            {selectedRepository && (
              <button
                onClick={() => setShowCreateSnapshot(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                创建快照
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">错误</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedRepository && (
            <div className="mt-8">
              <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              快照名称
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              状态
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              开始时间
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              耗时
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              分片状态
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              索引数量
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">操作</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {snapshots.map((snapshot) => (
                            <tr key={snapshot.snapshot}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {snapshot.snapshot}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  snapshot.state === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                  snapshot.state === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {snapshot.state}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(snapshot.start_time)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDuration(snapshot.duration_in_millis)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {snapshot.shards.successful}/{snapshot.shards.total}
                                {snapshot.shards.failed > 0 && (
                                  <span className="text-red-600 ml-1">
                                    (失败: {snapshot.shards.failed})
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {snapshot.indices.length}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleRestoreSnapshot(snapshot.snapshot)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  恢复
                                </button>
                                <button
                                  onClick={() => handleDeleteSnapshot(snapshot.snapshot)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 创建仓库弹窗 */}
      {showCreateRepo && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">创建快照仓库</h3>
                <div className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="repo-name" className="block text-sm font-medium text-gray-700">
                      仓库名称
                    </label>
                    <input
                      type="text"
                      id="repo-name"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="repo-type" className="block text-sm font-medium text-gray-700">
                      仓库类型
                    </label>
                    <select
                      id="repo-type"
                      value={newRepoType}
                      onChange={(e) => setNewRepoType(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="fs">文件系统</option>
                      <option value="url">URL</option>
                      <option value="s3">S3</option>
                    </select>
                  </div>
                  {newRepoType === 'fs' && (
                    <div>
                      <label htmlFor="repo-location" className="block text-sm font-medium text-gray-700">
                        存储位置（Elasticsearch 服务器上的路径）
                      </label>
                      <select
                        id="repo-location"
                        value={newRepoLocation}
                        onChange={(e) => setNewRepoLocation(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="">选择预设路径或输入自定义路径</option>
                        <option value="/usr/share/elasticsearch/snapshots">默认安装路径 (/usr/share/elasticsearch/snapshots)</option>
                        <option value="/usr/share/elasticsearch/data/snapshots">Docker 数据路径 (/usr/share/elasticsearch/data/snapshots)</option>
                        <option value="/var/lib/elasticsearch/snapshots">系统数据路径 (/var/lib/elasticsearch/snapshots)</option>
                      </select>
                      <input
                        type="text"
                        value={newRepoLocation}
                        onChange={(e) => setNewRepoLocation(e.target.value)}
                        className="mt-2 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                        placeholder="或输入自定义路径"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        注意：<br/>
                        1. 此路径必须是 Elasticsearch 服务器上的路径<br/>
                        2. 必须在 elasticsearch.yml 中添加配置：path.repo: ["/your/chosen/path"]<br/>
                        3. Elasticsearch 进程必须有此路径的读写权限<br/>
                        4. 配置后需要重启 Elasticsearch
                      </p>
                    </div>
                  )}
                  {newRepoType === 'url' && (
                    <div>
                      <label htmlFor="repo-location" className="block text-sm font-medium text-gray-700">
                        基础 URL
                      </label>
                      <input
                        type="text"
                        value={newRepoLocation}
                        onChange={(e) => setNewRepoLocation(e.target.value)}
                        className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                        placeholder="http://example.com/snapshots/"
                      />
                    </div>
                  )}
                  {newRepoType === 's3' && (
                    <div>
                      <label htmlFor="repo-location" className="block text-sm font-medium text-gray-700">
                        S3 存储桶
                      </label>
                      <input
                        type="text"
                        value={newRepoLocation}
                        onChange={(e) => setNewRepoLocation(e.target.value)}
                        className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                        placeholder="your-bucket-name"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        注意：使用 S3 需要在 Elasticsearch 中安装 repository-s3 插件
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleCreateRepository}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                >
                  创建
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateRepo(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 创建快照弹窗 */}
      {showCreateSnapshot && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">创建快照</h3>
                <div className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="snapshot-name" className="block text-sm font-medium text-gray-700">
                      快照名称
                    </label>
                    <input
                      type="text"
                      id="snapshot-name"
                      value={newSnapshotName}
                      onChange={(e) => setNewSnapshotName(e.target.value)}
                      className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      选择索引（可选，不选则备份所有索引）
                    </label>
                    <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                      {indices.map((index) => (
                        <label key={index} className="inline-flex items-center mr-4">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            checked={selectedIndices.has(index)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedIndices);
                              if (e.target.checked) {
                                newSelected.add(index);
                              } else {
                                newSelected.delete(index);
                              }
                              setSelectedIndices(newSelected);
                            }}
                          />
                          <span className="ml-2 text-sm text-gray-600">{index}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleCreateSnapshot}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                >
                  创建
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateSnapshot(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 