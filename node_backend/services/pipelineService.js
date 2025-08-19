const {
  PipelineJob,
  Stage1Data,
  Stage2Data,
  Stage3Data,
  Stage3Container,
  Stage4Data,
  JobUpdate,
  JobFile,
  User,
} = require("../models");

class PipelineService {
  // Get all jobs with related data
  async getAllJobs() {
    try {
      const jobs = await PipelineJob.findAll({
        include: [
          {
            model: User,
            as: "CreatedByUser",
            attributes: ["username"],
          },
          {
            model: User,
            as: "Stage2User",
            attributes: ["username"],
          },
          {
            model: User,
            as: "Stage3User",
            attributes: ["username"],
          },
          {
            model: User,
            as: "Customer",
            attributes: ["username"],
          },
          {
            model: Stage1Data,
            as: "Stage1",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage2Data,
            as: "Stage2",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage3Data,
            as: "Stage3",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          // CORRECTION: Stage3Container is directly associated with PipelineJob
          {
            model: Stage3Container,
            as: "Stage3Containers",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage4Data,
            as: "Stage4",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: JobUpdate,
            as: "Updates",
            include: [
              {
                model: User,
                as: "User",
                attributes: ["username"],
              },
            ],
            order: [["created_at", "DESC"]],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return jobs;
    } catch (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
  }

  // Get job by ID with all related data
  async getJobById(jobId) {
    try {
      const job = await PipelineJob.findByPk(jobId, {
        include: [
          {
            model: User,
            as: "CreatedByUser",
            attributes: ["username"],
          },
          {
            model: User,
            as: "Stage2User",
            attributes: ["username"],
          },
          {
            model: User,
            as: "Stage3User",
            attributes: ["username"],
          },
          {
            model: User,
            as: "Customer",
            attributes: ["username"],
          },
          {
            model: Stage1Data,
            as: "Stage1",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage2Data,
            as: "Stage2",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage3Data,
            as: "Stage3",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          // CORRECTION: Stage3Container is directly associated with PipelineJob
          {
            model: Stage3Container,
            as: "Stage3Containers",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage4Data,
            as: "Stage4",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: JobUpdate,
            as: "Updates",
            include: [
              {
                model: User,
                as: "User",
                attributes: ["username"],
              },
            ],
            order: [["created_at", "DESC"]],
          },
        ],
      });

      if (!job) {
        throw new Error("Job not found");
      }

      return job;
    } catch (error) {
      throw new Error(`Failed to fetch job: ${error.message}`);
    }
  }

  // Create new job with stage1 data
  async createJob(stage1Data, createdBy) {
    const transaction = await PipelineJob.sequelize.transaction();

    try {
      // Create pipeline job
      const job = await PipelineJob.create(
        {
          job_no: stage1Data.job_no,
          current_stage: "stage1",
          status: "active",
          created_by: createdBy,
          assigned_to_stage2: stage1Data.assigned_to_stage2 || null,
          assigned_to_stage3: stage1Data.assigned_to_stage3 || null,
          customer_id: stage1Data.customer_id || null,
          notification_email: stage1Data.notification_email || null,
        },
        { transaction }
      );

      // Create stage1 data
      await Stage1Data.create(
        {
          job_id: job.id,
          job_no: stage1Data.job_no,
          job_date: stage1Data.job_date || null,
          edi_job_no: stage1Data.edi_job_no || null,
          edi_date: stage1Data.edi_date || null,
          consignee: stage1Data.consignee || null,
          shipper: stage1Data.shipper || null,
          port_of_discharge: stage1Data.port_of_discharge || null,
          final_place_of_delivery: stage1Data.final_place_of_delivery || null,
          port_of_loading: stage1Data.port_of_loading || null,
          country_of_shipment: stage1Data.country_of_shipment || null,
          hbl_no: stage1Data.hbl_no || null,
          hbl_date: stage1Data.hbl_date || null,
          mbl_no: stage1Data.mbl_no || null,
          mbl_date: stage1Data.mbl_date || null,
          shipping_line: stage1Data.shipping_line || null,
          forwarder: stage1Data.forwarder || null,
          weight: stage1Data.weight || null,
          packages: stage1Data.packages || null,
          invoice_no: stage1Data.invoice_no || null,
          invoice_date: stage1Data.invoice_date || null,
          gateway_igm: stage1Data.gateway_igm || null,
          gateway_igm_date: stage1Data.gateway_igm_date || null,
          local_igm: stage1Data.local_igm || null,
          local_igm_date: stage1Data.local_igm_date || null,
          commodity: stage1Data.commodity || null,
          eta: stage1Data.eta || null,
          current_status: stage1Data.current_status || null,
          container_no: stage1Data.container_no || null,
          container_size: stage1Data.container_size || null,
          date_of_arrival: stage1Data.date_of_arrival || null,
        },
        { transaction }
      );

      // Add job update
      await JobUpdate.create(
        {
          job_id: job.id,
          user_id: createdBy,
          stage: "stage1",
          update_type: "status_change",
          message: "Job created",
        },
        { transaction }
      );

      await transaction.commit();

      // Return the complete job with all data
      return await this.getJobById(job.id);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to create job: ${error.message}`);
    }
  }

  // Update stage2 data
  async updateStage2Data(jobId, stage2Data, userId) {
    const transaction = await PipelineJob.sequelize.transaction();

    try {
      // Find or create stage2 data
      const [stage2, created] = await Stage2Data.findOrCreate({
        where: { job_id: jobId },
        defaults: {
          job_id: jobId,
          ...stage2Data,
        },
        transaction,
      });

      if (!created) {
        await stage2.update(stage2Data, { transaction });
      }

      // Update job stage if needed
      const job = await PipelineJob.findByPk(jobId, { transaction });
      if (job.current_stage === "stage1") {
        await job.update({ current_stage: "stage2" }, { transaction });
      }

      // Add job update
      await JobUpdate.create(
        {
          job_id: jobId,
          user_id: userId,
          stage: "stage2",
          update_type: "data_update",
          message: "Stage 2 data updated",
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getJobById(jobId);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to update stage 2 data: ${error.message}`);
    }
  }
  async updateStage3Data(jobId, stage3Data, userId) {
    const transaction = await PipelineJob.sequelize.transaction();

    try {
      // Find or create stage3 data
      const [stage3, created] = await Stage3Data.findOrCreate({
        where: { job_id: jobId },
        defaults: {
          job_id: jobId,
          ...stage3Data,
        },
        transaction,
      });

      if (!created) {
        await stage3.update(stage3Data, { transaction });
      }

      // Delete existing containers and add new ones
      await Stage3Container.destroy({
        where: { job_id: jobId },
        transaction,
      });

      if (stage3Data.containers && stage3Data.containers.length > 0) {
        for (const container of stage3Data.containers) {
          await Stage3Container.create(
            {
              job_id: jobId,
              container_no: container.container_no,
              size: container.size,
              vehicle_no: container.vehicle_no,
              date_of_offloading: container.date_of_offloading,
              empty_return_date: container.empty_return_date,
            },
            { transaction }
          );
        }
      }

      // Update job stage if needed
      const job = await PipelineJob.findByPk(jobId, { transaction });
      if (job.current_stage === "stage1" || job.current_stage === "stage2") {
        await job.update({ current_stage: "stage3" }, { transaction });
      }

      // Add job update
      await JobUpdate.create(
        {
          job_id: jobId,
          user_id: userId,
          stage: "stage3",
          update_type: "data_update",
          message: "Stage 3 data updated",
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getJobById(jobId);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to update stage 3 data: ${error.message}`);
    }
  }

  // Update stage4 data
  async updateStage4Data(jobId, stage4Data, userId) {
    const transaction = await PipelineJob.sequelize.transaction();

    try {
      // Find or create stage4 data
      const [stage4, created] = await Stage4Data.findOrCreate({
        where: { job_id: jobId },
        defaults: {
          job_id: jobId,
          ...stage4Data,
        },
        transaction,
      });

      if (!created) {
        await stage4.update(stage4Data, { transaction });
      }

      // Update job stage to stage4 or completed
      const job = await PipelineJob.findByPk(jobId, { transaction });
      let newStage = "stage4";
      if (stage4Data.acknowledge_date) {
        newStage = "completed";
      }

      await job.update({ current_stage: newStage }, { transaction });

      // Add job update
      const message =
        newStage === "completed" ? "Job completed" : "Stage 4 data updated";
      await JobUpdate.create(
        {
          job_id: jobId,
          user_id: userId,
          stage: "stage4",
          update_type: "data_update",
          message: message,
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getJobById(jobId);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to update stage 4 data: ${error.message}`);
    }
  }

  // Get jobs by creator (stage1 employee)
  async getJobsByCreator(userId) {
    try {
      return await PipelineJob.findAll({
        where: { created_by: userId },
        include: this.getJobIncludes(),
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      throw new Error(`Failed to fetch jobs by creator: ${error.message}`);
    }
  }

  // Get jobs by stage2 employee
  async getJobsByStage2(userId) {
    try {
      return await PipelineJob.findAll({
        where: { assigned_to_stage2: userId },
        include: this.getJobIncludes(),
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      throw new Error(`Failed to fetch jobs by stage2: ${error.message}`);
    }
  }

  // Get jobs by stage3 employee
  async getJobsByStage3(userId) {
    try {
      return await PipelineJob.findAll({
        where: { assigned_to_stage3: userId },
        include: this.getJobIncludes(),
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      throw new Error(`Failed to fetch jobs by stage3: ${error.message}`);
    }
  }

  // Get jobs by customer
  async getJobsByCustomer(userId) {
    try {
      return await PipelineJob.findAll({
        where: { customer_id: userId },
        include: this.getJobIncludes(),
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      throw new Error(`Failed to fetch jobs by customer: ${error.message}`);
    }
  }

  // Helper method for job includes

  getJobIncludes() {
    return [
      {
        model: User,
        as: "CreatedByUser",
        attributes: ["username"],
      },
      {
        model: User,
        as: "Stage2User",
        attributes: ["username"],
      },
      {
        model: User,
        as: "Stage3User",
        attributes: ["username"],
      },
      {
        model: User,
        as: "Customer",
        attributes: ["username"],
      },
      {
        model: Stage1Data,
        as: "Stage1", // Add the alias
        attributes: { exclude: ["created_at", "updated_at"] },
      },
      {
        model: Stage2Data,
        as: "Stage2", // Add the alias
        attributes: { exclude: ["created_at", "updated_at"] },
      },
      {
        model: Stage3Data,
        as: "Stage3", // Add the alias
        attributes: { exclude: ["created_at", "updated_at"] },
      },
      {
        model: Stage3Container,
        as: "Stage3Containers", // Add the alias
        attributes: { exclude: ["created_at", "updated_at"] },
      },
      {
        model: Stage4Data,
        as: "Stage4", // Add the alias
        attributes: { exclude: ["created_at", "updated_at"] },
      },
    ];
  }
  // File upload methods
  async uploadFile(fileData) {
    try {
      const file = await JobFile.create(fileData);

      // Add job update
      await JobUpdate.create({
        job_id: fileData.job_id,
        user_id: fileData.uploaded_by,
        stage: fileData.stage,
        update_type: "file_upload",
        message: `File uploaded: ${fileData.original_name}`,
        new_value: fileData.file_name,
      });

      return await this.getFileById(file.id);
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async getFilesByJobAndStage(jobId, stage) {
    try {
      return await JobFile.findAll({
        where: { job_id: jobId, stage },
        include: [
          {
            model: User,
            as: "UploadedByUser",
            attributes: ["username"],
          },
        ],
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      throw new Error(`Failed to get files: ${error.message}`);
    }
  }

  async getFileById(fileId) {
    try {
      const file = await JobFile.findByPk(fileId, {
        include: [
          {
            model: User,
            as: "UploadedByUser",
            attributes: ["username"],
          },
        ],
      });

      if (!file) {
        throw new Error("File not found");
      }

      return file;
    } catch (error) {
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  async deleteFile(fileId, userId) {
    try {
      const file = await this.getFileById(fileId);

      // Check if user has permission to delete
      if (file.uploaded_by !== userId) {
        throw new Error("Unauthorized to delete this file");
      }

      await file.destroy();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}

module.exports = new PipelineService();
