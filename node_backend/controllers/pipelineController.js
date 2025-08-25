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

      // Get jobs based on user role
      let jobs;
      switch (req.user.role) {
        case "stage1_employee":
          jobs = await pipelineService.getJobsByCreator(userId);
          break;
        case "stage2_employee":
          jobs = await pipelineService.getJobsByStage2(userId);
          break;
        case "stage3_employee":
          jobs = await pipelineService.getJobsByStage3(userId);
          break;
        case "customer":
          jobs = await pipelineService.getJobsByCustomer(userId);
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
      if (!this.hasJobAccess(req, job)) {
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

      const job = await pipelineService.createJob(req.body, req.session.userId);

      // Send notification (async - don't wait for it to complete)
      notificationService
        .notifyJobCreation(job.id, req.session.userId)
        .catch((error) => console.error("Failed to send notification:", error));

      res.status(201).json(job);
    } catch (error) {
      if (error.message.includes("Duplicate")) {
        return res.status(409).json({ error: "Job number already exists" });
      }
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
      if (!this.hasJobAccess(req, job)) {
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
      if (!this.hasJobAccess(req, job)) {
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
      if (!this.hasJobAccess(req, job)) {
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
      if (!this.hasJobAccess(req, job)) {
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

  // Helper methods
  hasJobAccess = (req, job) => {
    const userId = req.session.userId;

    // Admin and subadmin have access to all jobs
    if (req.user.isAdmin || req.user.role === "subadmin") {
      return true;
    }

    // Check role-based access
    switch (req.user.role) {
      case "stage2_employee":
        return job.assigned_to_stage2 === userId;
      case "stage3_employee":
        return job.assigned_to_stage3 === userId;
      case "customer":
        return job.customer_id === userId;
      case "stage1_employee":
        return job.created_by === userId;
      default:
        return false;
    }
  };
}

module.exports = new PipelineController();
