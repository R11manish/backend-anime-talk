FROM public.ecr.aws/lambda/nodejs:18


COPY dist ${LAMBDA_TASK_ROOT}/dist
COPY package*.json ${LAMBDA_TASK_ROOT}/


RUN npm install --only=production


CMD [ "dist/app.handler" ]