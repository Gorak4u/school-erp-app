import { schoolPrisma } from '../src/lib/prisma';

async function updateSmtpSettings() {
  try {
    // Update all existing SMTP settings to use your schoolId
    const schoolId = 'cmmrp6v3u000lcd56bw0u5txl';
    
    // First, let's see what settings exist
    const existingSettings = await schoolPrisma.schoolSetting.findMany({
      where: { group: 'smtp' }
    });
    
    console.log('Existing SMTP settings:', existingSettings);
    
    if (existingSettings.length > 0) {
      // Update all existing SMTP settings
      const updatePromises = existingSettings.map(setting => 
        schoolPrisma.schoolSetting.update({
          where: { id: setting.id },
          data: { schoolId }
        })
      );
      
      await Promise.all(updatePromises);
      console.log(`Updated ${existingSettings.length} SMTP settings with schoolId: ${schoolId}`);
    } else {
      console.log('No SMTP settings found. You need to configure them in Settings > SMTP & Payments');
    }
    
  } catch (error) {
    console.error('Error updating SMTP settings:', error);
  } finally {
    await schoolPrisma.$disconnect();
  }
}

updateSmtpSettings();
