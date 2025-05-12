import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ImageUploadProps {
  currentImage?: string;
  onImageUploaded: (imageUrl: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ currentImage, onImageUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultImageUrl = '/images/unknown.png';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
      setUploadError('Пожалуйста, выберите изображение');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Размер файла не должен превышать 5MB');
      return;
    }

    // Create local preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const response = await axios.post(`${API_URL}/uploads/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.url) {
        onImageUploaded(response.data.url);
      } else {
        throw new Error('Ошибка загрузки изображения');
      }
      
    } catch (error) {
      console.error('Image upload failed:', error);
      setUploadError('Не удалось загрузить изображение. Пожалуйста, попробуйте снова.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUploaded('');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageError = () => {
    if (previewUrl !== defaultImageUrl) {
      setPreviewUrl(defaultImageUrl);
    }
  };

  return (
    <div className="image-upload">
      <div className="mb-2 flex flex-col items-center">
        {previewUrl ? (
          <div className="relative w-40 h-40 mb-2">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-md shadow-sm"
              onError={handleImageError}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
              title="Удалить изображение"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center mb-2">
            <div className="text-center text-gray-400">
              <div className="text-sm">Нет изображения</div>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
        />
        
        <label
          htmlFor="image-upload"
          className={`px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
          tabIndex={0}
        >
          {isUploading ? 'Загрузка...' : (previewUrl ? 'Изменить изображение' : 'Загрузить изображение')}
        </label>
      </div>
      
      {uploadError && (
        <div className="text-red-500 text-sm text-center">{uploadError}</div>
      )}
    </div>
  );
};

export default ImageUpload; 