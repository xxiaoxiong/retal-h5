const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置信息
const buildDir = path.resolve(__dirname, './dist/build/h5');

// 确保dist/build/h5目录存在
if (!fs.existsSync(buildDir)) {
    console.error('构建目录不存在，请先运行 npm run build:h5');
    process.exit(1);
}

console.log('准备部署到uniCloud前端网页托管...');
console.log('1. 请先确保您已安装并配置HBuilderX');
console.log('2. 打开HBuilderX，菜单栏选择"视图" -> "uniCloud"');
console.log('3. 在uniCloud面板中，选择"云服务空间"');
console.log('4. 右键点击"前端网页托管"，选择"上传网站根目录"');
console.log('5. 选择以下目录作为上传源：');
console.log(buildDir);
console.log('\n或者，您可以直接使用uniCloud控制台上传：');
console.log('1. 访问 https://unicloud.dcloud.net.cn/');
console.log('2. 选择您的服务空间');
console.log('3. 前端网页托管 -> 上传网站根目录');
console.log('4. 选择以下目录作为上传源：');
console.log(buildDir); 