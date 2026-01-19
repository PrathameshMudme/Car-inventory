/**
 * Service for managing delivery note generation history
 */

/**
 * Check if sales manager has already generated a note for a vehicle
 * @param {Object} vehicle - Vehicle document
 * @param {string} userId - User ID to check
 * @returns {boolean} True if user has already generated a note
 */
const hasUserGeneratedNote = (vehicle, userId) => {
  if (!vehicle.deliveryNoteHistory || vehicle.deliveryNoteHistory.length === 0) {
    return false
  }
  
  return vehicle.deliveryNoteHistory.some(entry => {
    const entryUserId = entry.generatedBy?._id?.toString() || entry.generatedBy?.toString()
    return entryUserId === userId.toString()
  })
}

/**
 * Add a new delivery note history entry
 * @param {Object} vehicle - Vehicle document
 * @param {string} userId - User ID who generated the note
 * @param {string} vehicleNo - Vehicle number for filename
 * @returns {Promise<Object>} Updated vehicle document
 */
const addHistoryEntry = async (vehicle, userId, vehicleNo) => {
  const filename = `Delivery_Note_${vehicleNo}_${Date.now()}.pdf`
  
  if (!vehicle.deliveryNoteHistory) {
    vehicle.deliveryNoteHistory = []
  }
  
  vehicle.deliveryNoteHistory.push({
    generatedBy: userId,
    generatedAt: new Date(),
    filename: filename
  })
  
  return await vehicle.save()
}

/**
 * Determine if history should be saved based on user role and download mode
 * @param {Object} vehicle - Vehicle document
 * @param {Object} user - User object with role and _id
 * @param {boolean} isDownloadOnly - Whether this is download-only mode
 * @returns {Promise<boolean>} True if history should be saved
 */
const shouldSaveHistory = async (vehicle, user, isDownloadOnly) => {
  // Never save history for download-only requests
  if (isDownloadOnly) {
    return false
  }
  
  // Admin can always regenerate - save history each time
  if (user.role === 'admin') {
    return true
  }
  
  // Sales managers can only generate once per vehicle
  if (user.role === 'sales') {
    return !hasUserGeneratedNote(vehicle, user._id)
  }
  
  return false
}

/**
 * Save delivery note history if conditions are met
 * @param {Object} vehicle - Vehicle document
 * @param {Object} user - User object
 * @param {boolean} isDownloadOnly - Whether this is download-only mode
 * @returns {Promise<Object>} Updated vehicle document
 */
const saveHistoryIfNeeded = async (vehicle, user, isDownloadOnly) => {
  const shouldSave = await shouldSaveHistory(vehicle, user, isDownloadOnly)
  
  if (shouldSave) {
    return await addHistoryEntry(vehicle, user._id, vehicle.vehicleNo)
  }
  
  return vehicle
}

module.exports = {
  hasUserGeneratedNote,
  addHistoryEntry,
  shouldSaveHistory,
  saveHistoryIfNeeded
}
