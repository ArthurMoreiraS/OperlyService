import { createApp } from './app';
import { config, connectDatabase, disconnectDatabase } from './config';

const app = createApp();

async function startServer(): Promise<void> {
  try {
    // Conectar ao banco de dados
    await connectDatabase();
    console.log('✅ Database connected');

    // Iniciar o servidor
    const server = app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚗  OPERLY API  🚗                                      ║
║                                                           ║
║   Server running on port ${config.port.toString().padEnd(30)}║
║   Environment: ${config.nodeEnv.padEnd(40)}║
║   Health check: http://localhost:${config.port}/health ${' '.repeat(14)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log('HTTP server closed');
        await disconnectDatabase();
        console.log('Database disconnected');
        process.exit(0);
      });

      // Força o fechamento após 10 segundos
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Captura sinais de término
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Captura erros não tratados
    process.on('unhandledRejection', (reason: unknown) => {
      console.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

// Inicia o servidor
startServer();
