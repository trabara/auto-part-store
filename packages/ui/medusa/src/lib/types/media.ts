/**
 * Media entity — represents an image attached to an entity
 */
export interface Media {
  id: string
  url: string
  type: "thumbnail" | "image"
}

/**
 * Uploaded file — represents a file that has been uploaded but not yet saved
 */
export interface UploadedFile {
  id?: string
  url: string
  type?: string
}
