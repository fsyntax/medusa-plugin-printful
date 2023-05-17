import type { BatchJobService } from '@medusajs/medusa'
import type { AwilixContainer } from 'awilix'

export default async (container: AwilixContainer, config: Record<string, unknown>): Promise<void> => {
  setTimeout(async () => {
    try {
      const batchJobService: BatchJobService = container.resolve('batchJobService')
      console.log('Creating printful sync batch job')
      await batchJobService.create({
        created_by: null,
        type: 'printful-sync',
        context: {
          test: 'test',
        },
        dry_run: true,
      })
    }
    catch (e) {
      console.log('Error creating printful sync batch job', e)
    }
  }, 10000)
}
