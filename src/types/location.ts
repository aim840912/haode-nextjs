export interface Location {
  id: number
  name: string
  title: string
  address: string
  landmark: string
  phone: string
  lineId: string
  hours: string
  closedDays: string
  parking: string
  publicTransport: string
  features: string[]
  specialties: string[]
  coordinates: {
    lat: number
    lng: number
  }
  image: string
  isMain: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LocationService {
  getLocations(): Promise<Location[]>
  addLocation(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location>
  updateLocation(id: number, location: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Location>
  deleteLocation(id: number): Promise<void>
  getLocationById(id: number): Promise<Location | null>
}