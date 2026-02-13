import fs from 'fs/promises';
import path from 'path';
import { UserProfile, UserProfileSchema } from '../schemas/user.schema';

const DB_PATH = path.join(process.cwd(), 'src/mocks/database.json');

export class DriverService {
  private async getDB() {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  }

  async getDriverById(id: string): Promise<UserProfile | null> {
    const db = await this.getDB();
    const driver = db.drivers.find((d: UserProfile) => d.user_id === id);
    if (!driver) return null;
    return UserProfileSchema.parse(driver);
  }

  async getDriverByEmail(email: string): Promise<UserProfile | null> {
    const db = await this.getDB();
    const driver = db.drivers.find((d: UserProfile) => d.email === email);
    if (!driver) return null;
    return UserProfileSchema.parse(driver);
  }

  async toggleOnlineStatus(id: string): Promise<UserProfile> {
    // In a real app complexity, we would write back to the file or DB.
    // For this mock, we just return the modified driver in memory simulation or update the file.
    // Let's try to update the file for persistence in the session.
    const db = await this.getDB();
    const driverIndex = db.drivers.findIndex((d: UserProfile) => d.user_id === id);
    
    if (driverIndex === -1) throw new Error('Driver not found');
    
    // Note: isOnline is not in UserProfile schema, this might need adjustment
    // @ts-ignore - temporary fix for mock data
    db.drivers[driverIndex].isOnline = !db.drivers[driverIndex].isOnline;
    
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    
    return UserProfileSchema.parse(db.drivers[driverIndex]);
  }
}

export const driverService = new DriverService();
