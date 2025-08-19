"use client";
import { useState, useRef, useEffect, useCallback } from 'react';

export default function FileUpload({ jobId, stage, onFileUploaded, userRole, isAdmin, isSubadmin }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [canUpload, setCanUpload] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Check if user can upload to this stage
    const checkUploadPermission = () => {
      // Admin and subadmin can upload to any stage
      if (isAdmin || isSubadmin) {
        setCanUpload(true);
        return;
      }

      // Check role-based permissions
      switch (userRole) {
        case 'stage1_employee':
          setCanUpload(stage === 'stage1');
          break;
        case 'stage2_employee':
          setCanUpload(stage === 'stage2');
          break;
        case 'stage3_employee':
          setCanUpload(stage === 'stage3');
          break;
        case 'customer':
          setCanUpload(stage === 'stage4');
          break;
        default:
          setCanUpload(false);
      }
    };

    checkUploadPermission();
    
    // Load existing uploaded files for this stage
    loadUploadedFiles();
  }, [userRole, isAdmin, isSubadmin, stage, jobId,loadUploadedFiles]);

  const loadUploadedFiles = useCallback(async () => {
    try {
      console.log(`Loading files for job ${jobId}, stage ${stage}`);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/files?job_id=${jobId}&stage=${stage}`,
        { credentials: 'include' }
      );
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const files = await response.json();
        console.log(`Files received:`, files);
        // Ensure files is always an array
        setUploadedFiles(Array.isArray(files) ? files : []);
      } else {
        console.log(`Error response: ${response.status} ${response.statusText}`);
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error(`Error loading files for ${stage}:`, error);
      setUploadedFiles([]);
    }
  }, [  jobId, stage ]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('stage', stage);
    formData.append('description', description);

    const uploadPromises = files.map(async (file) => {
      const fileFormData = new FormData();
      fileFormData.append('job_id', jobId);
      fileFormData.append('stage', stage);
      fileFormData.append('description', description);
      fileFormData.append('file', file);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/files/upload`, {
          method: 'POST',
          body: fileFormData,
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, file: result.file, originalFile: file };
        } else {
          const error = await response.text();
          return { success: false, error, originalFile: file };
        }
      } catch (error) {
        return { success: false, error: error.message, originalFile: file };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
      // Reload all files to get the updated list
      await loadUploadedFiles();
      if (onFileUploaded) {
        onFileUploaded(successful.map(r => r.file));
      }
    }

    if (failed.length > 0) {
      failed.forEach(result => {
        alert(`Failed to upload ${result.originalFile.name}: ${result.error}`);
      });
    }

    setFiles([]);
    setDescription('');
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/files/download?id=${fileId}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download file');
      }
    } catch (error) {
      alert('Error downloading file: ' + error.message);
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/files/delete?id=${fileId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        // Reload all files to get the updated list
        await loadUploadedFiles();
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      alert('Error deleting file: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">File Uploads</h3>
      
      {/* Upload Section - Only show if user has permission */}
      {canUpload ? (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Files
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              accept="*/*"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can select multiple files. No file size limit.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for the uploaded files..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows="2"
            />
          </div>

          {files.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
              <ul className="text-sm text-gray-600">
                {files.map((file, index) => (
                  <li key={index} className="flex justify-between items-center py-1">
                    <span>{file.name}</span>
                    <span className="text-gray-500">({formatFileSize(file.size)})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            You don&apos;t have permission to upload files to this stage.
          </p>
        </div>
      )}

      {/* Uploaded Files Section */}
      {uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{file.original_name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(file.file_size)})</span>
                  </div>
                  {file.description && (
                    <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Uploaded by {file.uploaded_by_user} on {formatDate(file.created_at)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(file.id, file.original_name)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Download
                  </button>
                  {canUpload && (
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 