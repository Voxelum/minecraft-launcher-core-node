import defaultGateWay from 'default-gateway'
import { networkInterfaces } from 'os'
// import assert from 'uvu/assert'
import { createPmpClient } from '../lib/pmp'
import { describe, expect, test } from 'vitest'

describe.skip('pmp', async () => {
  test('createPmpClient v4', async () => {
    const gateway = await defaultGateWay.v4()
    console.log(gateway)

    const client = await createPmpClient(gateway.gateway)
    const result = await client.map({ type: 'tcp', private: 25565, public: 25565, ttl: 60 * 1000 })
    console.log(result)
    await client.unmap({ type: 'tcp', private: 25565, public: 25565 })

    client.close()
  }, { timeout: 100000 })

  test('createPmpClient v6', async () => {
    const gateway = await defaultGateWay.v6()
    console.log(gateway)

    const client = await createPmpClient(gateway.gateway)
    const result = await client.map({ type: 'tcp', private: 25565, public: 25565, ttl: 60 * 1000 })
    console.log(result)
    await client.unmap({ type: 'tcp', private: 25565, public: 25565 })

    client.close()
  }, { timeout: 100000 })
})