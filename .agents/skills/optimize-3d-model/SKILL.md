---
name: optimize-3d-model
description: Takes a .glb file, runs it through a compression tool to keep it under 5MB, and ensures it follows the Firebase storage naming convention.
---

# Optimize 3D Model Skill

When the user invokes `@optimize-3d-model`, you should execute the following steps to prepare a 3D model for upload:

## 1. Identify the Input File
- Determine the path to the `.glb` file the user wants to upload. If not provided, ask the user.

## 2. Compress the 3D Model
- Check the current file size using the `ls -lh` command.
- If the file is larger than 5MB (or if the user requests compression regardless), use a CLI compression tool to optimize it. 
- You may use a tool like `gltf-pipeline` for Draco compression:
  ```bash
  npx gltf-pipeline -i <input.glb> -o <output_compressed.glb> -d
  ```
- Alternatively, you can use `@gltf-transform/cli`:
  ```bash
  npx @gltf-transform/cli optimize <input.glb> <output_compressed.glb>
  ```
- Verify the compressed file is under 5MB. If not, repeat with more aggressive texture scaling options if supported by the tool.

## 3. Verify Firebase Naming Convention
- Ensure the output file adheres to the project's Firebase Storage naming convention for 3D models.
- Naming format: `[product_name_or_id]_[timestamp].glb`
- Example: `rustic_terracotta_vase_1709423812.glb`
- Make sure to convert any spaces to underscores and use all lowercase letters.
- Move/rename the compressed file to this final name.

## 4. Final Verification and Handoff
- Present the final optimized file path to the user.
- Detail the size reduction (e.g., "Compressed from 12MB to 3.2MB").
- The file is now ready for the user to upload via the Artisan Dashboard.
