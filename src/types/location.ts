export interface Location {
  id: string
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
  updateLocation(
    id: string,
    location: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Location>
  deleteLocation(id: string): Promise<void>
  getLocationById(id: string): Promise<Location | null>
}
