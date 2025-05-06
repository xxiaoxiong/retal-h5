const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置信息
const buildDir = path.resolve(__dirname, './dist/build/h5');
const deployBranch = 'gh-pages';

// 确保dist/build/h5目录存在
if (!fs.existsSync(buildDir)) {
    console.error('构建目录不存在，请先运行 npm run build:h5');
    process.exit(1);
}

try {
    // 创建临时目录
    const tempDir = path.resolve(__dirname, '.deploy_temp');
    if (fs.existsSync(tempDir)) {
        execSync(`rm -rf ${tempDir}`);
    }
    fs.mkdirSync(tempDir);

    // 初始化Git仓库
    process.chdir(tempDir);
    execSync('git init');
    execSync(`git checkout -b ${deployBranch}`);

    // 复制构建文件
    execSync(`cp -r ${buildDir}/* ${tempDir}`);

    // 提交文件
    execSync('git add .');
    execSync('git commit -m "Deploy to GitHub Pages"');

    // 推送到GitHub
    const repoUrl = execSync('git config --get remote.origin.url').toString().trim();
    execSync(`git push -f ${repoUrl} ${deployBranch}`);

    // 清理临时目录
    process.chdir(__dirname);
    execSync(`rm -rf ${tempDir}`);

    console.log(`成功部署到 ${deployBranch} 分支!`);
} catch (error) {
    console.error('部署过程中出错:', error);
} 