git add .
git commit -m "price range: vẽ được, cập nhật được volume khi thay đổi"
git push

# merge -> main 
git checkout main
git merge master 
git push origin main 

git checkout master

# deploy
# wrangler pages deploy example --project-name=itgiup-lwc-plugins --branch=production
