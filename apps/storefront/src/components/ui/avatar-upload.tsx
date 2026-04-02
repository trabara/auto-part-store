"use client";

import { Camera } from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { FileUpload, FileUploadProps, FileUploadTrigger } from "./file-upload";

export const title = "Avatar Upload";

export const AvatarUpload = ({ value, ...props }: Omit<FileUploadProps, "value"> & { value?: string }) => {


  return (
    <FileUpload
      accept="image/*"
      maxFiles={1}
      maxSize={2 * 1024 * 1024}
      {...props}
    >
      <FileUploadTrigger asChild>
        <button className="group relative cursor-pointer rounded-full">
          <Avatar className="size-24">
            <AvatarImage src={value} alt="Avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-6 text-white" />
          </div>
        </button>
      </FileUploadTrigger>
    </FileUpload>
  );
};
