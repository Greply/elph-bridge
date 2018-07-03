sdk-demo-server: cd ../sdk-demo/ && python -m SimpleHTTPServer 8888
rails-web-app: cd ../web/ && foreman start -p 9000
sdk-auto-build-setup: while true; do rollup provider.js --file ./dist/bundle.js --format iife --name "Elph"; sleep 2; done
sdk-server: python -m SimpleHTTPServer 8000