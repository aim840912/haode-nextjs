export interface SortableImage {
  id: string
  url?: string
  path: string
  size: 'thumbnail' | 'medium' | 'large'
  file?: File
  preview?: string
  position: number
  alt?: string
}

export interface SortableImageProps {
  image: SortableImage
  onRemove: (id: string) => void
}

export interface SortableImageGalleryProps {
  images: SortableImage[]
  onImagesReorder: (images: SortableImage[]) => void
  onImageRemove: (id: string) => void
  layout?: 'grid' | 'list'
  maxColumns?: number
  className?: string
}
