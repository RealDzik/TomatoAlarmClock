const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const svg2png = require('svg2png');

async function generateIcons() {
    const svgPath = path.join(__dirname, '../src/assets/icon.svg');
    const svgBuffer = fs.readFileSync(svgPath);
    
    // 生成不同尺寸的 PNG
    const sizes = [16, 32, 48, 64, 128, 256];
    
    for (const size of sizes) {
        const pngBuffer = await svg2png(svgBuffer, { width: size, height: size });
        fs.writeFileSync(
            path.join(__dirname, `../src/assets/icon-${size}.png`),
            pngBuffer
        );
    }

    // 生成 ICO 文件
    const pngBuffer = await svg2png(svgBuffer, { width: 256, height: 256 });
    await sharp(pngBuffer)
        .resize(256, 256)
        .toFile(path.join(__dirname, '../src/assets/icon.ico'));

    // 复制主要的图标文件
    fs.copyFileSync(
        path.join(__dirname, '../src/assets/icon-32.png'),
        path.join(__dirname, '../src/assets/icon.png')
    );

    console.log('Icons generated successfully!');
}

generateIcons().catch(console.error); 