import { AppDataSource } from '../config/database';
import { UserOnboarding } from '../models/UserOnboarding';

interface ProfileAnswers {
  militaryExperience: 'none' | 'conscript' | 'contract' | 'officer';
  education: string;
  specialization: string;
  physicalFitness: number;
  concerns: string[];
  skills: string[];
  preferredLearning: 'visual' | 'audio' | 'practical' | 'mixed';
  mentorPreference: boolean;
  nightShiftExperience: boolean;
}

interface RoadmapWeek {
  week: number;
  title: string;
  modules: string[];
  goals: string[];
  milestones: string[];
}

interface LearningTrajectory {
  trajectory: string[];
  estimatedDuration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  roadmap: RoadmapWeek[];
  personalRecommendations: string[];
}

export class OnboardingService {
  private onboardingRepository = AppDataSource.getRepository(UserOnboarding);

  /**
   * Generate personalized learning trajectory based on profile answers
   */
  generateTrajectory(answers: ProfileAnswers): LearningTrajectory {
    const trajectory: string[] = [];
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    let estimatedDuration = 14;

    // Baseline modules for everyone
    const baselineModules = [
      'Військові звичаї та традиції',
      'Безпека та дисципліна',
      'Основи військової фізичної підготовки'
    ];
    trajectory.push(...baselineModules);

    // Add based on military experience
    if (answers.militaryExperience === 'none') {
      trajectory.push(
        'Основи військової тактики',
        'Знайомство зі зброєю',
        'Сигнали та команди'
      );
      difficulty = 'hard';
      estimatedDuration = 21;
    } else if (answers.militaryExperience === 'conscript') {
      trajectory.push(
        'Поновлення знань про зброю',
        'Тактика в умовах сучасної війни'
      );
      difficulty = 'medium';
      estimatedDuration = 14;
    } else {
      difficulty = 'easy';
      estimatedDuration = 7;
    }

    // Add based on concerns
    if (answers.concerns.includes('Психологічна підготовка')) {
      trajectory.push('Психологічна гідність воїна');
    }
    if (answers.concerns.includes('Спеціальна фізична підготовка')) {
      trajectory.push('Спеціальна фізична підготовка');
    }
    if (answers.concerns.includes('Військова медицина')) {
      trajectory.push('Військова медицина: Алгоритм MARCH');
    }
    if (answers.concerns.includes('Мінна безпека')) {
      trajectory.push('Мінна безпека та розмінування');
    }
    if (answers.concerns.includes('Виживання в крайніх умовах')) {
      trajectory.push('Виживання в крайніх умовах');
    }

    // Add based on specialization
    if (answers.specialization.toLowerCase().includes('механ')) {
      trajectory.push('Механіка та техніка');
    }
    if (answers.specialization.toLowerCase().includes('зв')) {
      trajectory.push('Військова комунікація');
    }
    if (answers.specialization.toLowerCase().includes('медик')) {
      trajectory.push('Перша медична допомога');
    }

    // Generate roadmap
    const roadmap = this.generateRoadmap(trajectory, answers, estimatedDuration);

    // Generate personalized recommendations
    const recommendations = this.generateRecommendations(answers);

    return {
      trajectory,
      estimatedDuration,
      difficulty,
      roadmap,
      personalRecommendations: recommendations
    };
  }

  private generateRoadmap(
    modules: string[],
    answers: ProfileAnswers,
    totalDays: number
  ): RoadmapWeek[] {
    const weeks = Math.ceil(totalDays / 7);
    const modulesPerWeek = Math.ceil(modules.length / weeks);
    const roadmap: RoadmapWeek[] = [];

    const weekTitles = [
      'Первинна адаптація',
      'Основна підготовка',
      'Спеціалізована підготовка',
      'Інтеграція та захист'
    ];

    for (let week = 1; week <= weeks && week <= 4; week++) {
      const startIdx = (week - 1) * modulesPerWeek;
      const endIdx = Math.min(week * modulesPerWeek, modules.length);
      const weekModules = modules.slice(startIdx, endIdx);

      roadmap.push({
        week,
        title: weekTitles[week - 1] || `Тиждень ${week}`,
        modules: weekModules,
        goals: this.generateWeekGoals(week, answers),
        milestones: this.generateMilestones(week, weekModules)
      });
    }

    return roadmap;
  }

  private generateWeekGoals(week: number, answers: ProfileAnswers): string[] {
    const goals: { [key: number]: string[] } = {
      1: [
        'Адаптація до військового середовища',
        'Встановлення контактів з товаришами',
        'Розуміння основних правил та розпорядку'
      ],
      2: [
        'Опанування базових навичок',
        'Підвищення фізичної форми',
        'Розвиток командної роботи'
      ],
      3: [
        'Спеціалізована підготовка',
        'Розвиток професійних навичок',
        'Взяття на себе відповідальності'
      ],
      4: [
        'Інтеграція в структуру',
        'Демонстрація набутих навичок',
        'Планування подальшого розвитку'
      ]
    };

    return goals[week] || ['Продовження навчання'];
  }

  private generateMilestones(week: number, modules: string[]): string[] {
    const milestones: string[] = [];

    if (week === 1) {
      milestones.push('Капітальна екскурсія');
      milestones.push('Комунікативна гра з товаришами');
    } else if (week === 2) {
      milestones.push('Тест з безпеки та дисципліни');
      milestones.push('Фізичне тестування');
    } else if (week === 3) {
      milestones.push('Завдання спеціалізації');
      milestones.push('Практичні вправи');
    } else if (week === 4) {
      milestones.push('Підсумковий тест');
      milestones.push('Планування подальших кроків');
    }

    return milestones;
  }

  private generateRecommendations(answers: ProfileAnswers): string[] {
    const recommendations: string[] = [];

    // Experience-based
    if (answers.militaryExperience === 'none') {
      recommendations.push(
        '🔥 Перший день - найважливіший! Слухайте інших та спостерігайте.',
        '📚 Приділіть особливу увагу основам військової фізпідготовки.',
        '🧠 Не соромтеся запитувати досвідчених товаришів.'
      );
    } else {
      recommendations.push(
        '⭐ Користайтеся своїм досвідом, але будьте готові до змін.',
        '👥 Берітеся помагати новобранцям - це зміцнює команду.'
      );
    }

    // Physical fitness-based
    if (answers.physicalFitness <= 2) {
      recommendations.push(
        '💪 Фокусуйтеся на регулярних тренуваннях останнього тижня.',
        '🏃 Рекомендуємо додаткові сеанси з фізичної підготовки.'
      );
    } else if (answers.physicalFitness >= 4) {
      recommendations.push(
        '🏆 Ваша фізична форма -助силу команді. Поділіться досвідом!'
      );
    }

    // Learning preference-based
    if (answers.preferredLearning === 'visual') {
      recommendations.push('🎬 Активно використовуйте відеоматеріали в системі.');
    } else if (answers.preferredLearning === 'audio') {
      recommendations.push('🎧 Слухайте подкасти та аудіокниги для закріплення.');
    } else if (answers.preferredLearning === 'practical') {
      recommendations.push('🔨 Запрошуйте практичні тренування та симуляції.');
    }

    // Mentor preference
    if (answers.mentorPreference) {
      recommendations.push(
        '👥 Наш алгоритм уже шукає для вас ідеального ментора.',
        '💬 Перший контакт буде встановлений упродовж 24 годин.'
      );
    }

    // Night shift
    if (answers.nightShiftExperience) {
      recommendations.push(
        '🌙 Ваш досвід нічної роботи буде цінним активом.'
      );
    }

    // Default recommendations
    if (recommendations.length < 5) {
      recommendations.push(
        '✨ Завжди приділяйте увагу психоемоційному здоров\'ю.',
        '📋 Слідкуйте за своїм розпорядком та не пропускайте заняття.'
      );
    }

    return recommendations;
  }

  /**
   * Save onboarding record
   */
  async saveOnboarding(
    userId: string,
    profileAnswers: ProfileAnswers,
    trajectory: LearningTrajectory
  ): Promise<UserOnboarding> {
    const onboarding = this.onboardingRepository.create({
      userId,
      profileAnswers,
      generatedTrajectory: trajectory,
      isCompleted: true
    });

    return await this.onboardingRepository.save(onboarding);
  }

  /**
   * Get user's onboarding record
   */
  async getUserOnboarding(userId: string): Promise<UserOnboarding | null> {
    return await this.onboardingRepository.findOne({
      where: { userId }
    });
  }

  /**
   * Update onboarding progress
   */
  async updateProgress(
    userId: string,
    completedModules: number,
    totalModules: number
  ): Promise<UserOnboarding> {
    const onboarding = await this.getUserOnboarding(userId);
    if (!onboarding) throw new Error('Onboarding record not found');

    const week = Math.ceil((completedModules / totalModules) * 4);
    const score = Math.round((completedModules / totalModules) * 100);

    onboarding.progress = {
      week: Math.min(week, 4),
      completedModules,
      totalModules,
      score
    };

    return await this.onboardingRepository.save(onboarding);
  }
}
