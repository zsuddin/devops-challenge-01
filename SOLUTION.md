# DevSecOps Take-Home Exercise Solution Notes

## Local Setup
- setup docker and docker-compose
- create .env file in the root of the project using .env.example
- run: `docker-compose up -d`

## Test endpoint:
 - `curl -H "x-api-key: ${{ secrets.API_KEY }}" http://localhost:3000/releases`
 - `curl -H "x-api-key: ${{ secrets.API_KEY }}" http://localhost:3000/drift`
 - `curl -X POST http://localhost:3000/release -H "x-api-key: ${{ secrets.API_KEY }}" -H "Content-Type: application/json" -d '{"name": "application_one", "version": "1.0.2", "account": "staging", "region": "primary"}'
`

## Secuity 
- using a minimial nodejs image with no critical or high level CVE
- all api inputs are validated and cleaned
- sql queries are parameterized
- secrets secured using env file
- setup codeql for code scans
- setup container scans for detecting CVE
- setup SBOM scan for in depth package and sub-dependencies scan for CVE