cd vitepress
pnpm build

cd ..
rm -rf backend/dist
cp -r vitepress/.vitepress/dist backend/dist