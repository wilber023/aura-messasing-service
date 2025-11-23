'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const groups = [
      // Comunidades
      {
        id: uuidv4(),
        name: 'Apoyo Mutuo AURA',
        description: 'Comunidad de apoyo mutuo para jóvenes en proceso de reconexión. Un espacio seguro para compartir experiencias.',
        image_url: 'https://ui-avatars.com/api/?name=Apoyo+Mutuo&background=6366f1&color=fff&size=200',
        group_type: 'community',
        creator_profile_id: '44444444-4444-4444-4444-444444444444',
        external_id: null,
        max_members: null,
        is_public: true,
        status: 'active',
        settings: JSON.stringify({ allowMedia: true, requireApproval: false }),
        member_count: 3,
        last_message_at: new Date(),
        location: null,
        scheduled_at: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Mindfulness y Meditación',
        description: 'Grupo dedicado a prácticas de mindfulness y meditación guiada para el bienestar emocional.',
        image_url: 'https://ui-avatars.com/api/?name=Mindfulness&background=8b5cf6&color=fff&size=200',
        group_type: 'community',
        creator_profile_id: '44444444-4444-4444-4444-444444444444',
        external_id: null,
        max_members: 100,
        is_public: true,
        status: 'active',
        settings: JSON.stringify({ allowMedia: true, requireApproval: false }),
        member_count: 2,
        last_message_at: new Date(),
        location: null,
        scheduled_at: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Arte y Expresión',
        description: 'Expresa tus emociones a través del arte. Comparte tus creaciones y descubre las de otros.',
        image_url: 'https://ui-avatars.com/api/?name=Arte&background=ec4899&color=fff&size=200',
        group_type: 'community',
        creator_profile_id: '55555555-5555-5555-5555-555555555555',
        external_id: null,
        max_members: null,
        is_public: true,
        status: 'active',
        settings: JSON.stringify({ allowMedia: true, requireApproval: false }),
        member_count: 1,
        last_message_at: null,
        location: null,
        scheduled_at: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Actividades cerca de ti
      {
        id: uuidv4(),
        name: 'Caminata al Aire Libre',
        description: 'Actividad grupal de caminata en el parque. Conecta con la naturaleza y con otros miembros.',
        image_url: 'https://ui-avatars.com/api/?name=Caminata&background=10b981&color=fff&size=200',
        group_type: 'activity',
        creator_profile_id: '44444444-4444-4444-4444-444444444444',
        external_id: null,
        max_members: 20,
        is_public: true,
        status: 'active',
        settings: JSON.stringify({ allowMedia: true, requireApproval: true }),
        member_count: 2,
        last_message_at: new Date(),
        location: JSON.stringify({
          lat: 16.7569,
          lng: -93.1292,
          address: 'Parque Central, Tuxtla Gutiérrez, Chiapas'
        }),
        scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En 7 días
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Taller de Pintura',
        description: 'Taller práctico de pintura para expresar emociones. No necesitas experiencia previa.',
        image_url: 'https://ui-avatars.com/api/?name=Pintura&background=f59e0b&color=fff&size=200',
        group_type: 'activity',
        creator_profile_id: '55555555-5555-5555-5555-555555555555',
        external_id: null,
        max_members: 15,
        is_public: true,
        status: 'active',
        settings: JSON.stringify({ allowMedia: true, requireApproval: true }),
        member_count: 1,
        last_message_at: null,
        location: JSON.stringify({
          lat: 16.7520,
          lng: -93.1150,
          address: 'Centro Cultural, Tuxtla Gutiérrez, Chiapas'
        }),
        scheduled_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // En 14 días
        created_at: new Date(),
        updated_at: new Date()
      },
      // Grupo privado
      {
        id: uuidv4(),
        name: 'Grupo de Terapia A',
        description: 'Grupo privado de terapia grupal. Solo para miembros invitados.',
        image_url: 'https://ui-avatars.com/api/?name=Terapia&background=64748b&color=fff&size=200',
        group_type: 'private',
        creator_profile_id: '44444444-4444-4444-4444-444444444444',
        external_id: null,
        max_members: 10,
        is_public: false,
        status: 'active',
        settings: JSON.stringify({ allowMedia: false, requireApproval: true }),
        member_count: 2,
        last_message_at: new Date(),
        location: null,
        scheduled_at: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('groups', groups, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('groups', null, {});
  }
};