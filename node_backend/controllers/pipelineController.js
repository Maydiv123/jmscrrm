const pipelineService = require("../services/pipelineService");
const notificationService = require("../services/notificationService");

class PipelineController {
  // Get all jobs (admin only)
  async getAllJobs(req, res) {
    console.log("getAllJobs - Session:", req.session);
    console.log("getAllJobs - User:", req.user);
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is admin or subadmin
      if (!req.user.isAdmin && req.user.role !== "subadmin") {
        return res.status(403).json({ error: "Access denied" });
      }

      console.log("Calling pipelineService.getAllJobs()...");
      const jobs = await pipelineService.getAllJobs();
      console.log("Jobs fetched successfully:", jobs.length);
      res.json(jobs);
    } catch (error) {
      console.error("Error in getAllJobs controller:", error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  }

  // Get jobs for current user based on role
  async getMyJobs(req, res) {
    console.log("getAllJobs - Session:", req.session);
    console.log("getAllJobs - User:", req.user);
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.session.userId;

      // Admin and subadmin get all jobs
      if (req.user.isAdmin || req.user.role === "subadmin") {
        const jobs = await pipelineService.getAllJobs();
        return res.json(jobs);
      }

      // For stage employees, show only jobs in their current stage
      let jobs;
      switch (req.user.role) {
        case "stage1_employee":
          // Stage 1 employees see all jobs in stage1
          jobs = await pipelineService.getJobsByCurrentStage("stage1");
          break;
        case "stage2_employee":
          // Stage 2 employees see only jobs currently in stage2
          jobs = await pipelineService.getJobsByCurrentStage("stage2");
          break;
        case "stage3_employee":
          // Stage 3 employees see only jobs currently in stage3
          jobs = await pipelineService.getJobsByCurrentStage("stage3");
          break;
        case "customer":
          // Customers see only jobs currently in stage4
          jobs = await pipelineService.getJobsByCurrentStage("stage4");
          break;
        default:
          return res.status(403).json({ error: "Invalid role" });
      }

      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get job by ID
  getJobById = async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const jobId = parseInt(req.params.id);
      const job = await pipelineService.getJobById(jobId);

      // Check if user has access to this job
      if (!PipelineController.hasJobAccess(req, job)) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(job);
    } catch (error) {
      if (error.message === "Job not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  };

  // Get next job number
  async getNextJobNumber(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is admin, subadmin, or stage1_employee
      if (!req.user.isAdmin && req.user.role !== "subadmin" && req.user.role !== "stage1_employee") {
        return res.status(403).json({ error: "Access denied. Only admin, subadmin, and stage1 employees can access this." });
      }

      const nextJobNumber = await pipelineService.getNextJobNumber();
      res.json({ nextJobNumber });
    } catch (error) {
      console.error('GetNextJobNumber error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Check if job number exists
  async checkJobNumberExists(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is admin, subadmin, or stage1_employee
      if (!req.user.isAdmin && req.user.role !== "subadmin" && req.user.role !== "stage1_employee") {
        return res.status(403).json({ error: "Access denied. Only admin, subadmin, and stage1 employees can access this." });
      }

      const { job_no } = req.query;
      
      if (!job_no) {
        return res.status(400).json({ error: "Job number is required" });
      }

      const exists = await pipelineService.checkJobNumberExists(job_no);
      res.json({ exists });
    } catch (error) {
      console.error('CheckJobNumberExists error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Create new job
  async createJob(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is admin, subadmin, or stage1_employee
      if (!req.user.isAdmin && req.user.role !== "subadmin" && req.user.role !== "stage1_employee") {
        return res.status(403).json({ error: "Access denied. Only admin, subadmin, and stage1 employees can create pipelines." });
      }

      console.log('CreateJob request body:', JSON.stringify(req.body, null, 2));
      console.log('User ID:', req.session.userId);
      console.log('User role:', req.user.role);

      const job = await pipelineService.createJob(req.body, req.session.userId);

      // Send notification (async - don't wait for it to complete)
      notificationService
        .notifyJobCreation(job.id, req.session.userId)
        .catch((error) => console.error("Failed to send notification:", error));

      res.status(201).json(job);
    } catch (error) {
      console.error('CreateJob error:', error);
      
      if (error.message.includes("Duplicate")) {
        return res.status(409).json({ error: "Job number already exists" });
      }
      
      if (error.message.includes("Invalid") || error.message.includes("required")) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }

  // Update job
  async updateJob(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is admin, subadmin, or stage1_employee
      if (!req.user.isAdmin && req.user.role !== "subadmin" && req.user.role !== "stage1_employee") {
        return res.status(403).json({ error: "Access denied. Only admin, subadmin, and stage1 employees can update pipelines." });
      }

      const jobId = parseInt(req.params.id);
      const job = await pipelineService.updateJob(jobId, req.body, req.session.userId);

      res.json({ message: "Job updated successfully", job });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update stage1 data (admin only)
  async updateStage1(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied. Only admin can edit stage 1 data." });
      }

      const jobId = parseInt(req.params.id);
      console.log("Stage1 update request for job:", jobId);
      console.log("Request body:", req.body);
      console.log("User ID:", req.session.userId);

      const job = await pipelineService.updateStage1Data(
        jobId,
        req.body,
        req.session.userId
      );

      res.json({ message: "Stage 1 data updated successfully", job });
    } catch (error) {
      console.error("Error in updateStage1 controller:", error);
      res.status(500).json({ error: error.message });
    }
  }
  // Update stage2 data
  // controllers/pipelineController.js - Add debug logging to updateStage2
  async updateStage2(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is stage2 employee or admin
      if (!req.user.isAdmin && req.user.role !== "stage2_employee") {
        return res.status(403).json({ error: "Access denied" });
      }

      const jobId = parseInt(req.params.id);
      console.log("Stage2 update request for job:", jobId);
      console.log("Request body:", req.body);
      console.log("User ID:", req.session.userId);

      const job = await pipelineService.updateStage2Data(
        jobId,
        req.body,
        req.session.userId
      );

      // Send notification (async)
      notificationService
        .notifyStageCompletion(jobId, "stage2", req.session.userId)
        .catch((error) => console.error("Failed to send notification:", error));

      res.json({ message: "Stage 2 data updated successfully", job });
    } catch (error) {
      console.error("Error in updateStage2 controller:", error);
      res.status(500).json({ error: error.message });
    }
  }
  async updateStage3(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is stage3 employee or admin
      if (!req.user.isAdmin && req.user.role !== "stage3_employee") {
        return res.status(403).json({ error: "Access denied" });
      }

      const jobId = parseInt(req.params.id);
      const job = await pipelineService.updateStage3Data(
        jobId,
        req.body,
        req.session.userId
      );

      // Send notification (async)
      notificationService
        .notifyStageCompletion(jobId, "stage3", req.session.userId)
        .catch((error) => console.error("Failed to send notification:", error));

      res.json({ message: "Stage 3 data updated successfully", job });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update stage4 data
  async updateStage4(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is customer or admin
      if (!req.user.isAdmin && req.user.role !== "customer") {
        return res.status(403).json({ error: "Access denied" });
      }

      const jobId = parseInt(req.params.id);
      const job = await pipelineService.updateStage4Data(
        jobId,
        req.body,
        req.session.userId
      );

      // Send notification (async)
      notificationService
        .notifyStageCompletion(jobId, "stage4", req.session.userId)
        .catch((error) => console.error("Failed to send notification:", error));

      res.json({ message: "Stage 4 data updated successfully", job });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  // Get stage history for a job
  async getJobStageHistory(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const jobId = parseInt(req.params.id);
      const stageHistory = await pipelineService.getJobStageHistory(jobId);

      res.json(stageHistory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // File upload
  async uploadFile(req, res) {
      console.log("Request body:", req.body);
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Check if user has access to this job
      const jobId = parseInt(req.body.job_id);
      const job = await pipelineService.getJobById(jobId);
      if (!PipelineController.hasJobAccess(req, job)) {
        return res.status(403).json({ error: "Access denied. You don't have permission to upload files for this job." });
      }

      const fileData = {
        job_id: jobId,
        stage: req.body.stage,
        uploaded_by: req.session.userId,
        file_name: req.file.filename,
        original_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        description: req.body.description || null,
      };

      const file = await pipelineService.uploadFile(fileData);
      res.json({ success: true, message: "File uploaded successfully", file });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  // controllers/pipelineController.js - Add these missing methods

  // Get files for a job and stage
  getFiles = async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { job_id, stage } = req.query;

      if (!job_id || !stage) {
        return res.status(400).json({ error: "Job ID and stage are required" });
      }

      const jobId = parseInt(job_id);

      // Check if user has access to this job
      const job = await pipelineService.getJobById(jobId);
      if (!PipelineController.hasJobAccess(req, job)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const files = await pipelineService.getFilesByJobAndStage(jobId, stage);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Download file
  // Update the downloadFile method to use req.params instead of req.query
  downloadFile = async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const fileId = parseInt(req.params.id);
      const file = await pipelineService.getFileById(fileId);

      // Check if user has access to this job
      const job = await pipelineService.getJobById(file.job_id);
      if (!PipelineController.hasJobAccess(req, job)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if file exists on disk
      const fs = require("fs");
      const path = require("path");

      if (!fs.existsSync(file.file_path)) {
        return res.status(404).json({ error: "File not found on server" });
      }

      // Set headers for download
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.original_name}"`
      );
      if (file.file_type) {
        res.setHeader("Content-Type", file.file_type);
      }

      // Stream the file
      const fileStream = fs.createReadStream(file.file_path);
      fileStream.pipe(res);
    } catch (error) {
      if (error.message === "File not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  };

  // Delete file
  deleteFile = async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const fileId = parseInt(req.params.id);
      const file = await pipelineService.getFileById(fileId);

      // Check if user has access to this job
      const job = await pipelineService.getJobById(file.job_id);
      if (!PipelineController.hasJobAccess(req, job)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if user is the uploader or admin
      if (file.uploaded_by !== req.session.userId && !req.user.isAdmin) {
        return res
          .status(403)
          .json({ error: "You can only delete your own files" });
      }

      const fs = require("fs");
      const path = require("path");

      // Delete file from disk
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }

      // Delete file record from database
      await pipelineService.deleteFile(fileId, req.session.userId);

      res.json({ success: true, message: "File deleted successfully" });
    } catch (error) {
      if (error.message === "File not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  };

  // Advance job stage manually
  advanceJobStage = async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const jobId = parseInt(req.params.id);
      const { targetStage } = req.body;

      if (!targetStage) {
        return res.status(400).json({ error: "Target stage is required" });
      }

      // Get job to check access
      const job = await pipelineService.getJobById(jobId);
      if (!PipelineController.hasJobAccess(req, job)) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Advance the job stage
      const result = await pipelineService.advanceJobStage(jobId, targetStage, req.session.userId);
      
      res.json(result);
    } catch (error) {
      console.error("Error advancing job stage:", error);
      res.status(500).json({ error: error.message });
    }
  };

  // Get next job number
  async getNextJobNumber(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const nextJobNumber = await pipelineService.getNextJobNumber();
      res.json({ nextJobNumber });
    } catch (error) {
      console.error("Error getting next job number:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Helper methods
  static hasJobAccess(req, job) {
    const userId = req.session.userId;

    // Check if req.user exists
    if (!req.user) {
      console.error('req.user is undefined in hasJobAccess');
      return false;
    }

    // Admin and subadmin have access to all jobs
    if (req.user.isAdmin || req.user.role === "subadmin") {
      return true;
    }

    // Check role-based access by current stage
    switch (req.user.role) {
      case "stage1_employee":
        return job.created_by === userId;
      case "stage2_employee":
        return job.current_stage === "stage2";
      case "stage3_employee":
        return job.current_stage === "stage3";
      case "customer":
        return job.current_stage === "stage4";
      default:
        return false;
    }
  }

  // Delete job (admin only)
  deleteJob = async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied. Admin privileges required." });
      }

      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }

      await pipelineService.deleteJob(jobId, req.session.userId);

      res.json({ success: true, message: "Job deleted successfully" });
    } catch (error) {
      if (error.message === "Job not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  };
}

module.exports = new PipelineController();