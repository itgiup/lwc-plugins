# itgiup-lwc-plugins - Lightweight Charts™ Plugin

Developed for Lightweight Charts version: `v5.0.0`. 
Các plugin cho tradingview lightweight, src/example là thư mục chạy bằng vitejs, chạy mẫu các plugin đã viết.
- src/price-ranges là plugin dùng để vẽ đó khoảng giá và thời gian, tổng khối lượng 

## Running Locally

```shell
npm install
npm run dev
```

Visit `localhost:5173` in the browser.

## Compiling

```shell
npm run compile
```

Check the output in the `dist` folder.

## Publishing To NPM

You can configure the contents of the package's `package.json` within the
`compile.mjs` script.

Once you have compiled the plugin (see above section) then you can publish the
package to NPM with these commands:

```shell
cd dist
npm publish
```

Hint: append `--dry-run` to the end of the publish command to see the results of
the publish command without actually uploading the package to NPM.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact

@itgiup