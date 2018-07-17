sdk-elph-com: cd ../sdk-s3/ && python http-server.py 9000

# TODO(vamsi): determine a way to use npm run build here instead.
sdk-auto-build-setup: while true; do rollup src/index.js --file ./dist/index.js --format iife --name "Elph"; sleep 2; done

jsdeliver: python -m SimpleHTTPServer 8888

elph-com: cd ../web/ && foreman start -p 8000