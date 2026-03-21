import { calculateGhtkFee } from './src/plugins/shipghtk/api';
import { calculateViettelPostFee } from './src/plugins/shipviettelpost/api';

async function run() {
    console.log("=== Testing GHTK API ===");
    try {
        const ghtkReq = {
            province: 'Hà Nội',
            district: 'Quận Hoàn Kiếm',
            weight: 500,
            orderTotal: 200000
        };
        const ghtkRes = await calculateGhtkFee(ghtkReq);
        console.log("GHTK Response:", JSON.stringify(ghtkRes, null, 2));
    } catch(e) {
        console.error("GHTK Error", e);
    }
    
    console.log("\n=== Testing ViettelPost API ===");
    try {
        const vtpReq = {
            province: 'Hà Nội',
            district: 'Quận Hoàn Kiếm',
            weight: 500,
            orderTotal: 200000
        };
        const vtpRes = await calculateViettelPostFee(vtpReq);
        console.log("VTP Response:", JSON.stringify(vtpRes, null, 2));
    } catch(e) {
        console.error("VTP Error", e);
    }
}

run();
