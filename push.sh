git add .
git commit -m "price range: màu của label volume đã có thể thay đổi được"
git push

# merge -> main 
git checkout main
git merge master 
git push origin main 

git checkout master

# deploy
# wrangler pages deploy example --project-name=itgiup-lwc-plugins --branch=production
