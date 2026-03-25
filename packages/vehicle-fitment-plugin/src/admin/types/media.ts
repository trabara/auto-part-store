export type Media = {
    id?: string
    url: string,
    file_id: string,
    type?: "thumbnail" | "image"
}

export type UploadedFile = {
    id: string
    url: string
    type?: "thumbnail" | "image"
}