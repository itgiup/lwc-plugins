yarn build
yarn compile 


git add .
git commit -m "fix compile phải kèm types"
git push

# merge -> main 
git checkout main
git merge master 
git push origin main 

git checkout master

# deploy
# wrangler pages deploy example --project-name=itgiup-lwc-plugins --branch=production
