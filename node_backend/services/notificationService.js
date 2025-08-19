const nodemailer = require('nodemailer');
const { User, PipelineJob, Stage1Data } = require('../models');

class NotificationService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    // Get SMTP configuration from environment variables
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.FROM_EMAIL || smtpUser;

    if (!smtpUser || !smtpPass) {
      console.warn('SMTP credentials not configured. Email notifications will be disabled.');
      return null;
    }

    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  // Send stage completion email
  async sendStageCompletionEmail(emailData) {
    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping email notification.');
      return false;
    }

    const subject = `Stage Completion Notification - Job ${emailData.jobNo}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Stage Completion Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #1f2937; }
        .stage-badge { 
            display: inline-block; 
            padding: 4px 12px; 
            background-color: #10b981; 
            color: white; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: bold; 
        }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Stage Completion Notification</h1>
        </div>
        <div class="content">
            <p>Hello Admin,</p>
            
            <p>A pipeline stage has been successfully completed. Here are the details:</p>
            
            <div class="info-row">
                <span class="label">Job Number:</span>
                <span class="value">${emailData.jobNo}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Job Title:</span>
                <span class="value">${emailData.jobTitle}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Completed Stage:</span>
                <span class="stage-badge">${emailData.stageName}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Completed By:</span>
                <span class="value">${emailData.completedBy}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Completion Time:</span>
                <span class="value">${emailData.completedAt}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Next Stage:</span>
                <span class="value">${emailData.nextStage}</span>
            </div>
            
            <p style="margin-top: 20px;">
                <strong>Action Required:</strong> Please review the completed stage and proceed with the next stage if everything is in order.
            </p>
            
            <div class="footer">
                <p>This is an automated notification from the MayDiv CRM System.</p>
                <p>If you have any questions, please contact the system administrator.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

    try {
      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: emailData.adminEmail,
        subject: subject,
        html: html
      });

      console.log(`Stage completion email sent successfully to ${emailData.adminEmail} for job ${emailData.jobNo}`);
      return true;
    } catch (error) {
      console.error('Failed to send stage completion email:', error);
      return false;
    }
  }

  // Send job creation email
  async sendJobCreationEmail(jobNo, createdBy, adminEmail) {
    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping email notification.');
      return false;
    }

    const subject = `New Pipeline Job Created - ${jobNo}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Job Creation Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #1f2937; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🆕 New Pipeline Job Created</h1>
        </div>
        <div class="content">
            <p>Hello Admin,</p>
            
            <p>A new pipeline job has been created in the system. Here are the details:</p>
            
            <div class="info-row">
                <span class="label">Job Number:</span>
                <span class="value">${jobNo}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Created By:</span>
                <span class="value">${createdBy}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">Stage 1 - Initial Setup</span>
            </div>
            
            <p style="margin-top: 20px;">
                <strong>Action Required:</strong> Please review the new job and assign it to the appropriate team members.
            </p>
            
            <div class="footer">
                <p>This is an automated notification from the MayDiv CRM System.</p>
                <p>If you have any questions, please contact the system administrator.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

    try {
      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: adminEmail,
        subject: subject,
        html: html
      });

      console.log(`Job creation email sent successfully to ${adminEmail} for job ${jobNo}`);
      return true;
    } catch (error) {
      console.error('Failed to send job creation email:', error);
      return false;
    }
  }

  // Notify stage completion
  async notifyStageCompletion(jobId, stage, completedByUserId) {
    try {
      // Get job details
      const jobDetails = await this.getJobDetails(jobId);
      if (!jobDetails) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Get user details
      const userDetails = await this.getUserDetails(completedByUserId);
      if (!userDetails) {
        throw new Error(`User ${completedByUserId} not found`);
      }

      // Get notification email
      const notificationEmail = await this.getNotificationEmail(jobId);

      // Determine next stage and stage name
      const nextStage = this.getNextStage(stage);
      const stageName = this.getStageName(stage);

      // Prepare email data
      const emailData = {
        jobNo: jobDetails.job_no,
        jobTitle: `Import/Export Job - ${jobDetails.job_no}`,
        stage: stage,
        stageName: stageName,
        completedBy: userDetails.username,
        completedAt: new Date().toLocaleString(),
        nextStage: nextStage,
        adminEmail: notificationEmail
      };

      // Send email
      return await this.sendStageCompletionEmail(emailData);
    } catch (error) {
      console.error('Failed to send stage completion notification:', error);
      return false;
    }
  }

  // Notify job creation
  async notifyJobCreation(jobId, createdByUserId) {
    try {
      // Get job details
      const jobDetails = await this.getJobDetails(jobId);
      if (!jobDetails) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Get user details
      const userDetails = await this.getUserDetails(createdByUserId);
      if (!userDetails) {
        throw new Error(`User ${createdByUserId} not found`);
      }

      // Get notification email
      const notificationEmail = await this.getNotificationEmail(jobId);

      // Send email
      return await this.sendJobCreationEmail(
        jobDetails.job_no,
        userDetails.username,
        notificationEmail
      );
    } catch (error) {
      console.error('Failed to send job creation notification:', error);
      return false;
    }
  }

  // Test email connection
  async testEmailConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not configured');
    }

    try {
      await this.transporter.verify();
      console.log('Email service connection test successful');
      return true;
    } catch (error) {
      throw new Error(`Failed to connect to SMTP server: ${error.message}`);
    }
  }

  // Helper methods
  async getJobDetails(jobId) {
    const job = await PipelineJob.findByPk(jobId, {
      include: [{
        model: Stage1Data,
        attributes: ['consignee', 'shipper', 'commodity']
      }]
    });

    if (!job) {
      return null;
    }

    return {
      id: job.id,
      job_no: job.job_no,
      current_stage: job.current_stage,
      status: job.status,
      created_at: job.created_at,
      consignee: job.Stage1Data ? job.Stage1Data.consignee : null,
      shipper: job.Stage1Data ? job.Stage1Data.shipper : null,
      commodity: job.Stage1Data ? job.Stage1Data.commodity : null,
      notification_email: job.notification_email
    };
  }

  async getUserDetails(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'role']
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
  }

  async getNotificationEmail(jobId) {
    // First try to get job-specific notification email
    const job = await PipelineJob.findByPk(jobId, {
      attributes: ['notification_email']
    });

    if (job && job.notification_email) {
      return job.notification_email;
    }

    // If no job-specific email, try to get admin email from environment
    if (process.env.ADMIN_EMAIL) {
      return process.env.ADMIN_EMAIL;
    }

    // Fallback: get first admin user's email
    const adminUser = await User.findOne({
      where: { is_admin: true },
      attributes: ['email']
    });

    if (adminUser && adminUser.email) {
      return adminUser.email;
    }

    // Final fallback
    return 'admin@maydiv.com';
  }

  getNextStage(currentStage) {
    switch (currentStage) {
      case 'stage1':
        return 'Stage 2 - Customs & Documentation';
      case 'stage2':
        return 'Stage 3 - Clearance & Logistics';
      case 'stage3':
        return 'Stage 4 - Billing & Completion';
      case 'stage4':
        return 'Completed';
      default:
        return 'Unknown';
    }
  }

  getStageName(stage) {
    switch (stage) {
      case 'stage1':
        return 'Stage 1 - Initial Setup';
      case 'stage2':
        return 'Stage 2 - Customs & Documentation';
      case 'stage3':
        return 'Stage 3 - Clearance & Logistics';
      case 'stage4':
        return 'Stage 4 - Billing & Completion';
      case 'completed':
        return 'Completed';
      default:
        return stage;
    }
  }
}

module.exports = new NotificationService();