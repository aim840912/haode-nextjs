import { Location } from '@/types/location'
import { promises as fs } from 'fs'
import path from 'path'

interface LocationService {
  getLocations(): Promise<Location[]>
  addLocation(locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location>
  updateLocation(id: number, locationData: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Location>
  deleteLocation(id: number): Promise<void>
  getLocationById(id: number): Promise<Location | null>
}

export class JsonLocationService implements LocationService {
  private readonly filePath = path.join(process.cwd(), 'src/data/locations.json')

  async getLocations(): Promise<Location[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading locations:', error)
      return []
    }
  }

  async addLocation(locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    const locations = await this.getLocations()
    const newId = Math.max(...locations.map(l => l.id), 0) + 1
    
    const newLocation: Location = {
      ...locationData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    locations.push(newLocation)
    await this.saveLocations(locations)
    return newLocation
  }

  async updateLocation(id: number, locationData: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Location> {
    const locations = await this.getLocations()
    const index = locations.findIndex(l => l.id === id)
    
    if (index === -1) {
      throw new Error('Location not found')
    }

    const updatedLocation = {
      ...locations[index],
      ...locationData,
      updatedAt: new Date().toISOString()
    }
    
    locations[index] = updatedLocation
    await this.saveLocations(locations)
    return updatedLocation
  }

  async deleteLocation(id: number): Promise<void> {
    const locations = await this.getLocations()
    const filteredLocations = locations.filter(l => l.id !== id)
    await this.saveLocations(filteredLocations)
  }

  async getLocationById(id: number): Promise<Location | null> {
    const locations = await this.getLocations()
    return locations.find(l => l.id === id) || null
  }

  private async saveLocations(locations: Location[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(locations, null, 2), 'utf-8')
  }
}

// 將來改成資料庫時，只需要替換這行
export const locationService: LocationService = new JsonLocationService()

// Supabase implementation
// import { supabaseLocationService } from './supabaseLocationService'
// export const locationService = supabaseLocationService