git add .
git commit -m "price range: ok"
git push

# merge -> main 
git checkout main
git merge master 
git push origin main 

git checkout master

# deploy
# wrangler pages deploy example --project-name=itgiup-lwc-plugins --branch=production
