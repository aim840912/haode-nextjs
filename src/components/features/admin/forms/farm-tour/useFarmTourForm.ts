import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { useFarmTourSubmit } from '@/hooks/farm-tour/useFarmTourSubmit'
import { ProductImage } from '@/types/product'

interface FarmTourFormData {
  start_month: number
  end_month: number
  title: string
  activities: string[]
  price: number
  available: boolean
  note: string
}

interface FieldErrors {
  title: string
  activities: string
  price: string
  start_month: string
  end_month: string
}

export function useFarmTourForm() {
  const router = useRouter()
  const [images, setImages] = useState<ProductImage[]>([])
  const [activityId] = useState(() => uuidv4())

  const [formData, setFormData] = useState<FarmTourFormData>({
    start_month: 1,
    end_month: 12,
    title: '',
    activities: [''],
    price: 0,
    available: true,
    note: '',
  })

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    title: '',
    activities: '',
    price: '',
    start_month: '',
    end_month: '',
  })

  const { submitError, submitSuccess, loading, submitActivity } = useFarmTourSubmit()

  const validateField = (field: string, value: unknown): string => {
    switch (field) {
      case 'title':
        return !String(value).trim() ? '請輸入活動標題' : ''
      case 'activities':
        const validActivities = Array.isArray(value)
          ? value.filter(activity => String(activity).trim() !== '')
          : []
        return validActivities.length === 0 ? '至少需要一個活動項目' : ''
      case 'price':
        return Number(value) < 0 ? '價格不能為負數' : ''
      case 'start_month':
        return Number(value) < 1 || Number(value) > 12 ? '開始月份必須是 1-12' : ''
      case 'end_month':
        return Number(value) < 1 || Number(value) > 12 ? '結束月份必須是 1-12' : ''
      default:
        return ''
    }
  }

  const handleFieldChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFieldBlur = (field: string, value: unknown) => {
    const error = validateField(field, value)
    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newFieldErrors = {
      title: validateField('title', formData.title),
      activities: validateField('activities', formData.activities),
      price: validateField('price', formData.price),
      start_month: validateField('start_month', formData.start_month),
      end_month: validateField('end_month', formData.end_month),
    }

    setFieldErrors(newFieldErrors)

    const hasFieldErrors = Object.values(newFieldErrors).some(error => error !== '')
    if (hasFieldErrors) {
      return
    }

    const success = await submitActivity(activityId, formData, images)

    if (success) {
      setTimeout(() => {
        router.push('/admin/farm-tour')
      }, 1500)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const newValue =
      type === 'number'
        ? Number(value)
        : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : name === 'start_month' || name === 'end_month' || name === 'price'
            ? Number(value)
            : value

    handleFieldChange(name, newValue)
  }

  const handleImagesChange = (newImages: ProductImage[]) => {
    setImages(newImages)
  }

  const handleActivityChange = (index: number, value: string) => {
    const newActivities = [...formData.activities]
    newActivities[index] = value
    handleFieldChange('activities', newActivities)
  }

  const handleAddActivity = () => {
    handleFieldChange('activities', [...formData.activities, ''])
  }

  const handleRemoveActivity = (index: number) => {
    const newActivities = formData.activities.filter((_, i) => i !== index)
    handleFieldChange('activities', newActivities)
  }

  return {
    activityId,
    formData,
    images,
    fieldErrors,
    submitError,
    submitSuccess,
    loading,
    handleSubmit,
    handleInputChange,
    handleFieldBlur,
    handleImagesChange,
    handleActivityChange,
    handleAddActivity,
    handleRemoveActivity,
  }
}
