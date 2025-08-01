package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"maydiv-crm/internal/models"
	"maydiv-crm/internal/repository"
	"maydiv-crm/internal/services"

	"github.com/gorilla/sessions"
)

type PipelineHandler struct {
	pipelineRepo *repository.PipelineRepository
	userRepo     *repository.UserRepository
	sessionStore *sessions.CookieStore
	notificationService *services.NotificationService
}

func NewPipelineHandler(pipelineRepo *repository.PipelineRepository, userRepo *repository.UserRepository, sessionStore *sessions.CookieStore, notificationService *services.NotificationService) *PipelineHandler {
	return &PipelineHandler{
		pipelineRepo: pipelineRepo,
		userRepo:     userRepo,
		sessionStore: sessionStore,
		notificationService: notificationService,
	}
}

// HandleJobs handles GET /api/pipeline/jobs (admin only - all jobs) and POST /api/pipeline/jobs (admin only - create job)
func (h *PipelineHandler) HandleJobs(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		h.getAllJobs(w, r)
	} else if r.Method == http.MethodPost {
		h.createJob(w, r)
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleMyJobs handles GET /api/pipeline/myjobs - gets jobs assigned to current user based on their role
func (h *PipelineHandler) HandleMyJobs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := h.getUserID(r)
	fmt.Printf("HandleMyJobs - getUserID returned: %d\n", userID)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get user role
	fmt.Printf("Looking up user with ID: %d\n", userID)
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		fmt.Printf("User not found error: %v\n", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	fmt.Printf("Found user: %s (ID: %d, Role: %s)\n", user.Username, user.ID, user.Role)

	// Admin gets all jobs
	if user.IsAdmin {
		jobs, err := h.pipelineRepo.GetAllJobs()
		if err != nil {
			http.Error(w, "Failed to fetch jobs", http.StatusInternalServerError)
			return
		}
		writeJSON(w, jobs)
		return
	}

	// Subadmin gets all jobs (same as admin)
	if user.Role == "subadmin" {
		jobs, err := h.pipelineRepo.GetAllJobs()
		if err != nil {
			http.Error(w, "Failed to fetch jobs", http.StatusInternalServerError)
			return
		}
		writeJSON(w, jobs)
		return
	}

	// Get jobs based on user role
	fmt.Printf("Getting jobs for user ID %d with role %s\n", userID, user.Role)
	jobs, err := h.pipelineRepo.GetJobsByUserRole(userID, user.Role)
	if err != nil {
		fmt.Printf("Error getting jobs: %v\n", err)
		http.Error(w, "Failed to fetch jobs", http.StatusInternalServerError)
		return
	}

	fmt.Printf("Found %d jobs for user\n", len(jobs))
	writeJSON(w, jobs)
}

// Debug endpoint to check database state
func (h *PipelineHandler) HandleDebug(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get all users
	users, err := h.userRepo.GetAll()
	if err != nil {
		http.Error(w, "Failed to get users", http.StatusInternalServerError)
		return
	}

	// Get all jobs
	jobs, err := h.pipelineRepo.GetAllJobs()
	if err != nil {
		http.Error(w, "Failed to get jobs", http.StatusInternalServerError)
		return
	}

	debugInfo := map[string]interface{}{
		"users": users,
		"jobs":  jobs,
	}

	writeJSON(w, debugInfo)
}

// HandleJobByID handles GET /api/pipeline/jobs/{id} - get specific job details
func (h *PipelineHandler) HandleJobByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := h.getUserID(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract job ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	fmt.Printf("URL Path: %s\n", r.URL.Path)
	fmt.Printf("Path parts: %v\n", pathParts)
	fmt.Printf("Path parts length: %d\n", len(pathParts))
	
	if len(pathParts) < 5 {
		fmt.Printf("Invalid path length: %d\n", len(pathParts))
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	fmt.Printf("Job ID from path: %s\n", pathParts[4])
	jobID, err := strconv.Atoi(pathParts[4])
	if err != nil {
		fmt.Printf("Error converting job ID: %v\n", err)
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}
	fmt.Printf("Parsed job ID: %d\n", jobID)

	job, err := h.pipelineRepo.GetJobByID(jobID)
	if err != nil {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	// Check if user has access to this job
	if !h.hasJobAccess(r, jobID) {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	writeJSON(w, job)
}

// HandleStage2Update handles PUT /api/pipeline/jobs/{id}/stage2
func (h *PipelineHandler) HandleStage2Update(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := h.getUserID(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if user is stage2 employee or admin
	user, err := h.userRepo.GetByID(userID)
	if err != nil || (!user.IsAdmin && user.Role != "stage2_employee") {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	jobID, err := h.extractJobID(r)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	var req models.Stage2UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err = h.pipelineRepo.UpdateStage2Data(jobID, &req, userID)
	if err != nil {
		http.Error(w, "Failed to update stage 2 data", http.StatusInternalServerError)
		return
	}

	// Send notification to admin about stage completion
	go func() {
		if err := h.notificationService.NotifyStageCompletion(jobID, "stage2", userID); err != nil {
			fmt.Printf("Failed to send stage 2 completion notification: %v\n", err)
		}
	}()

	writeJSON(w, map[string]string{"message": "Stage 2 data updated successfully"})
}

// HandleStage3Update handles PUT /api/pipeline/jobs/{id}/stage3
func (h *PipelineHandler) HandleStage3Update(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := h.getUserID(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if user is stage3 employee or admin
	user, err := h.userRepo.GetByID(userID)
	if err != nil || (!user.IsAdmin && user.Role != "stage3_employee") {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	jobID, err := h.extractJobID(r)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	var req models.Stage3UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err = h.pipelineRepo.UpdateStage3Data(jobID, &req, userID)
	if err != nil {
		http.Error(w, "Failed to update stage 3 data", http.StatusInternalServerError)
		return
	}

	// Send notification to admin about stage completion
	go func() {
		if err := h.notificationService.NotifyStageCompletion(jobID, "stage3", userID); err != nil {
			fmt.Printf("Failed to send stage 3 completion notification: %v\n", err)
		}
	}()

	writeJSON(w, map[string]string{"message": "Stage 3 data updated successfully"})
}

// HandleStage4Update handles PUT /api/pipeline/jobs/{id}/stage4
func (h *PipelineHandler) HandleStage4Update(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := h.getUserID(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if user is customer or admin
	user, err := h.userRepo.GetByID(userID)
	if err != nil || (!user.IsAdmin && user.Role != "customer") {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	jobID, err := h.extractJobID(r)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	var req models.Stage4UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err = h.pipelineRepo.UpdateStage4Data(jobID, &req, userID)
	if err != nil {
		http.Error(w, "Failed to update stage 4 data", http.StatusInternalServerError)
		return
	}

	// Send notification to admin about stage completion
	go func() {
		if err := h.notificationService.NotifyStageCompletion(jobID, "stage4", userID); err != nil {
			fmt.Printf("Failed to send stage 4 completion notification: %v\n", err)
		}
	}()

	writeJSON(w, map[string]string{"message": "Stage 4 data updated successfully"})
}

// File upload handlers
func (h *PipelineHandler) HandleFileUpload(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form (max 50MB)
	err := r.ParseMultipartForm(50 << 20)
	if err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}
	
	// Get user from session
	userID, err := h.getUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	// Get form data
	jobIDStr := r.FormValue("job_id")
	stage := r.FormValue("stage")
	description := r.FormValue("description")
	
	if jobIDStr == "" || stage == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}
	
	jobID, err := strconv.Atoi(jobIDStr)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}
	
	// Check if user has access to this job
	if !h.hasJobAccess(r, jobID) {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}
	
	// Check file upload permissions based on user role and stage
	if !h.canUploadToStage(r, jobID, stage) {
		http.Error(w, "You don't have permission to upload files to this stage", http.StatusForbidden)
		return
	}
	
	// Get uploaded file
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "No file uploaded", http.StatusBadRequest)
		return
	}
	defer file.Close()
	
	// Create uploads directory if it doesn't exist
	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Printf("Error creating upload directory: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	fileName := fmt.Sprintf("%d_%s_%d%s", jobID, stage, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, fileName)
	
	// Create file on disk
	dst, err := os.Create(filePath)
	if err != nil {
		log.Printf("Error creating file: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	
	// Copy uploaded file to destination
	_, err = io.Copy(dst, file)
	if err != nil {
		log.Printf("Error copying file: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	// Save file info to database
	uploadedFile, err := h.pipelineRepo.UploadFile(
		jobID, stage, userID, fileName, header.Filename, filePath, 
		header.Size, header.Header.Get("Content-Type"), description,
	)
	if err != nil {
		log.Printf("Error saving file info: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.FileUploadResponse{
		Success: true,
		Message: "File uploaded successfully",
		File:    uploadedFile,
	})
}

func (h *PipelineHandler) HandleFileDownload(w http.ResponseWriter, r *http.Request) {
	// Get file ID from URL
	fileIDStr := r.URL.Query().Get("id")
	if fileIDStr == "" {
		http.Error(w, "File ID required", http.StatusBadRequest)
		return
	}
	
	fileID, err := strconv.Atoi(fileIDStr)
	if err != nil {
		http.Error(w, "Invalid file ID", http.StatusBadRequest)
		return
	}
	
	// Get file info from database
	file, err := h.pipelineRepo.GetFileByID(fileID)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	
	// Check if user has access to this job
	if !h.hasJobAccess(r, file.JobID) {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}
	
	// Check if file exists on disk
	if _, err := os.Stat(file.FilePath); os.IsNotExist(err) {
		http.Error(w, "File not found on disk", http.StatusNotFound)
		return
	}
	
	// Serve file
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", file.OriginalName))
	if file.FileType != nil {
		w.Header().Set("Content-Type", *file.FileType)
	}
	http.ServeFile(w, r, file.FilePath)
}

func (h *PipelineHandler) HandleGetFiles(w http.ResponseWriter, r *http.Request) {
	jobIDStr := r.URL.Query().Get("job_id")
	stage := r.URL.Query().Get("stage")
	
	if jobIDStr == "" || stage == "" {
		http.Error(w, "Job ID and stage required", http.StatusBadRequest)
		return
	}
	
	jobID, err := strconv.Atoi(jobIDStr)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}
	
	// Check if user has access to this job
	if !h.hasJobAccess(r, jobID) {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}
	
	// Get files for this job and stage
	files, err := h.pipelineRepo.GetFilesByJobAndStage(jobID, stage)
	if err != nil {
		log.Printf("Error getting files: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(files)
}

func (h *PipelineHandler) HandleDeleteFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	fileIDStr := r.URL.Query().Get("id")
	if fileIDStr == "" {
		http.Error(w, "File ID required", http.StatusBadRequest)
		return
	}
	
	fileID, err := strconv.Atoi(fileIDStr)
	if err != nil {
		http.Error(w, "Invalid file ID", http.StatusBadRequest)
		return
	}
	
	// Get user from session
	userID, err := h.getUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	// Delete file
	err = h.pipelineRepo.DeleteFile(fileID, userID)
	if err != nil {
		log.Printf("Error deleting file: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "File deleted successfully",
	})
}

// Private helper methods

func (h *PipelineHandler) getAllJobs(w http.ResponseWriter, r *http.Request) {
	if !h.isAdminOrSubadmin(r) {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	jobs, err := h.pipelineRepo.GetAllJobs()
	if err != nil {
		http.Error(w, "Failed to fetch jobs", http.StatusInternalServerError)
		return
	}

	writeJSON(w, jobs)
}

func (h *PipelineHandler) createJob(w http.ResponseWriter, r *http.Request) {
	if !h.isAdminOrSubadmin(r) {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	userID := h.getUserID(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

		var req models.Stage1CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("JSON decode error: %v\n", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	
	// Validate required fields
	if req.JobNo == "" {
		http.Error(w, "Job number is required", http.StatusBadRequest)
		return
	}

	job, err := h.pipelineRepo.CreateJob(&req, userID)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			http.Error(w, "Job number already exists", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to create job", http.StatusInternalServerError)
		return
	}

	// Send notification to admin about new job creation
	go func() {
		if err := h.notificationService.NotifyJobCreation(job.ID, userID); err != nil {
			fmt.Printf("Failed to send job creation notification: %v\n", err)
		}
	}()

	writeJSON(w, job)
}

func (h *PipelineHandler) extractJobID(r *http.Request) (int, error) {
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		return 0, fmt.Errorf("invalid path")
	}

	return strconv.Atoi(pathParts[4])
}

func (h *PipelineHandler) hasJobAccess(r *http.Request, jobID int) bool {
	userID := h.getUserID(r)
	if userID == 0 {
		return false
	}

	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		return false
	}

	// Admin and subadmin have access to all jobs
	if user.IsAdmin || user.Role == "subadmin" {
		return true
	}

	// Get job details to check role-based access
	job, err := h.pipelineRepo.GetJobByID(jobID)
	if err != nil {
		return false
	}

	// Check role-based access
	switch user.Role {
	case "stage2_employee":
		return job.AssignedToStage2 != nil && *job.AssignedToStage2 == userID
	case "stage3_employee":
		return job.AssignedToStage3 != nil && *job.AssignedToStage3 == userID
	case "customer":
		return job.CustomerID != nil && *job.CustomerID == userID
	default:
		return false
	}
}

func (h *PipelineHandler) canUploadToStage(r *http.Request, jobID int, stage string) bool {
	userID := h.getUserID(r)
	if userID == 0 {
		return false
	}

	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		return false
	}

	// Admin and subadmin can upload to any stage
	if user.IsAdmin || user.Role == "subadmin" {
		return true
	}

	// Get job details to check role-based access
	job, err := h.pipelineRepo.GetJobByID(jobID)
	if err != nil {
		return false
	}

	// Check role-based access for upload permission
	switch user.Role {
	case "stage2_employee":
		// Stage 2 employee can only upload to stage2
		return stage == "stage2" && job.AssignedToStage2 != nil && *job.AssignedToStage2 == userID
	case "stage3_employee":
		// Stage 3 employee can only upload to stage3
		return stage == "stage3" && job.AssignedToStage3 != nil && *job.AssignedToStage3 == userID
	case "customer":
		// Customer can only upload to stage4
		return stage == "stage4" && job.CustomerID != nil && *job.CustomerID == userID
	case "stage1_employee":
		// Stage 1 employee can only upload to stage1
		return stage == "stage1" && job.CreatedBy == userID
	default:
		return false
	}
}

func (h *PipelineHandler) isAdmin(r *http.Request) bool {
	session, err := h.sessionStore.Get(r, "session")
	if err != nil {
		return false
	}

	userID, ok := session.Values["user_id"].(int)
	if !ok {
		return false
	}

	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		return false
	}

	return user.IsAdmin
}

func (h *PipelineHandler) isSubadmin(r *http.Request) bool {
	session, err := h.sessionStore.Get(r, "session")
	if err != nil {
		return false
	}

	userID, ok := session.Values["user_id"].(int)
	if !ok {
		return false
	}

	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		return false
	}

	return user.Role == "subadmin"
}

func (h *PipelineHandler) isAdminOrSubadmin(r *http.Request) bool {
	return h.isAdmin(r) || h.isSubadmin(r)
}

func (h *PipelineHandler) getUserID(r *http.Request) int {
	session, err := h.sessionStore.Get(r, "session")
	if err != nil {
		return 0
	}

	userID, ok := session.Values["user_id"].(int)
	if !ok {
		return 0
	}

	return userID
}

func (h *PipelineHandler) getUserIDFromSession(r *http.Request) (int, error) {
	session, err := h.sessionStore.Get(r, "session")
	if err != nil {
		return 0, err
	}

	userID, ok := session.Values["user_id"].(int)
	if !ok {
		return 0, fmt.Errorf("user not authenticated")
	}

	return userID, nil
} 